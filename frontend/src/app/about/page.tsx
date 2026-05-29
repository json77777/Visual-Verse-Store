export default function AboutPage() {
  return (
    <div className="flex-1">
      <main className="mx-auto w-full max-w-5xl px-8 pt-14 pb-16">
        <div className="mx-auto w-full max-w-230">
          <p className="font-dm-sans font-medium text-[10px] uppercase tracking-[0.18em] text-white/40">Our Story</p>
          <h1 className="mt-3 font-syne font-extrabold text-3xl tracking-[-0.03em] text-white/90">
            Built by Editors. For Editors.
          </h1>

          <div className="mt-8 h-px w-full bg-white/10" />

          <div className="mt-8 space-y-5 font-dm-sans font-normal text-sm leading-6 text-white/70">
            <p>
              We didn&apos;t start this store from a boardroom, we started it from a
              video timeline.
            </p>

            <p>
              As editors, we know the feeling of staring at a deadline, wishing for
              a specific tool, plugin, or overlay that just didn&apos;t exist... or at
              least, didn&apos;t work the way a real professional needed it to. Visual Verse
              was born out of that exact frustration.
            </p>
          </div>

          <h2 className="mt-12 font-syne font-bold text-xl tracking-[-0.02em] text-white/90">
            The Mission: Elevating Your Craft
          </h2>
          <p className="mt-4 font-dm-sans font-normal text-sm leading-6 text-white/70">
            The goal is simple: to give you the technical leverage you need to
            execute high-concept visual ideas without the technical headaches. We
            craft production-ready assets that don&apos;t compromise on performance or
            visual fidelity, cutting down your technical grind so you can focus
            entirely on the art of storytelling.
          </p>

          <p className="mt-6 font-dm-sans font-normal text-sm text-white/70">We focus on delivering:</p>
          <ul className="mt-4 space-y-3 font-dm-sans font-normal text-sm text-white/70">
            <li>
              <span className="font-medium text-white/90">Meticulous Design:</span>{" "}
              Every plugin and asset is torture-tested in real, high-stress
              production environments.
            </li>
            <li>
              <span className="font-medium text-white/90">Timeline Optimization:</span>{" "}
              Lightweight, high-performance tools designed to protect your VRAM
              and keep playback smooth.
            </li>
            <li>
              <span className="font-medium text-white/90">Pro-Grade Quality:</span>{" "}
              High-fidelity elements that blend seamlessly into cinema-grade
              workflows of storytelling.
            </li>
          </ul>

          <h2 className="mt-14 font-syne font-bold text-xl tracking-[-0.02em] text-white/90">
            A Growing Global Community
          </h2>
          <p className="mt-4 font-dm-sans font-light text-sm italic text-white/60">
            &quot;Your workflow is your signature. We just help you refine it faster.&quot;
          </p>

          <div className="mt-5 space-y-5 font-dm-sans font-normal text-sm leading-6 text-white/70">
            <p>
              We aren&apos;t just selling digital products, we are building a
              collective. Today, creators and editors across the globe rely on our tools
              to elevate their projects, smash deadlines, and push the boundaries
              of motion graphics and visual identity.
            </p>
            <p>
              Whether you&apos;re cutting a cinematic YouTube intro, a commercial
              piece, or a passion project, we&apos;re here to sharpen your edge.
            </p>
          </div>

          <h2 className="mt-14 font-syne font-bold text-xl tracking-[-0.02em] text-white/90">
            The Visual Verse Blueprint
          </h2>

          <div className="mt-6">
            <div className="grid grid-cols-2 gap-6 font-dm-sans font-medium text-xs tracking-wide text-white/70">
              <p>What You Get</p>
              <p>Why It Matters</p>
            </div>
            <div className="mt-4 h-px w-full bg-white/10" />

            <div className="divide-y divide-white/10">
              <div className="grid grid-cols-2 gap-6 py-5">
                <p className="font-dm-sans font-medium text-sm text-white/90">Real-World Tested</p>
                <p className="font-dm-sans font-normal text-sm text-white/70">
                  Built for actual timelines, not just idealized benchmark tests.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 py-5">
                <p className="font-dm-sans font-medium text-sm text-white/90">Workflow First</p>
                <p className="font-dm-sans font-normal text-sm text-white/70">
                  Engineered to eliminate tedious, repetitive tasks.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 py-5">
                <p className="font-dm-sans font-medium text-sm text-white/90">Community Driven</p>
                <p className="font-dm-sans font-normal text-sm text-white/70">
                  Developed based on direct feedback from 5k+ editing peers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
