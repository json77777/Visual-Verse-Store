import { EventEmitter } from "events";

const jobs = new Map();

function now() {
  return Date.now();
}

function ensureJob(jobId) {
  if (!jobId) return null;
  const key = String(jobId);
  const existing = jobs.get(key);
  if (existing) return existing;

  const emitter = new EventEmitter();
  emitter.setMaxListeners(50);

  const state = {
    jobId: key,
    phase: "starting",
    percent: 0,
    message: "Starting",
    done: false,
    error: null,
    updatedAt: now(),
  };

  const job = { state, emitter };
  jobs.set(key, job);
  return job;
}

function updateJob(jobId, patch) {
  const job = ensureJob(jobId);
  if (!job) return;

  Object.assign(job.state, patch);
  job.state.updatedAt = now();
  job.emitter.emit("update", job.state);
}

function completeJob(jobId, message = "Done") {
  const job = ensureJob(jobId);
  if (!job) return;

  updateJob(jobId, {
    phase: "done",
    percent: 100,
    message,
    done: true,
    error: null,
  });

  job.emitter.emit("done", job.state);

  // cleanup later (keep for a bit so reconnect still sees final state)
  setTimeout(() => {
    jobs.delete(String(jobId));
  }, 5 * 60 * 1000);
}

function failJob(jobId, errorMessage = "Failed") {
  const job = ensureJob(jobId);
  if (!job) return;

  updateJob(jobId, {
    phase: "error",
    message: errorMessage,
    done: true,
    error: errorMessage,
  });

  job.emitter.emit("done", job.state);

  setTimeout(() => {
    jobs.delete(String(jobId));
  }, 5 * 60 * 1000);
}

function getJobState(jobId) {
  const job = jobs.get(String(jobId));
  return job?.state ?? null;
}

function attachJobSse(jobId, req, res) {
  const job = ensureJob(jobId);
  if (!job) return;

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // If compression middleware ever gets added, this helps flush.
  res.flushHeaders?.();

  const writeEvent = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  writeEvent("init", job.state);

  const onUpdate = (state) => writeEvent("progress", state);
  const onDone = (state) => {
    writeEvent("done", state);
    cleanup();
    res.end();
  };

  const keepAlive = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 15000);

  const cleanup = () => {
    clearInterval(keepAlive);
    job.emitter.off("update", onUpdate);
    job.emitter.off("done", onDone);
  };

  job.emitter.on("update", onUpdate);
  job.emitter.on("done", onDone);

  req.on("close", () => {
    cleanup();
  });
}

export { attachJobSse, completeJob, ensureJob, failJob, getJobState, updateJob };
