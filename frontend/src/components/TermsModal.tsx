export function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-center pt-[120px] pb-8 bg-black/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-2xl h-full overflow-hidden rounded-xl border border-white/20 bg-[#0A0A0A] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="font-syne font-bold text-lg text-white">Terms & Conditions</h2>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto px-6 py-6 font-dm-sans text-[13px] text-white/70 space-y-5 leading-relaxed scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
          data-lenis-prevent="true"
        >
          <h3 className="text-white font-semibold mb-2">TERMS & CONDITIONS FOR DIGITAL PRODUCT PURCHASES</h3>

          <p>By checking this box and proceeding with the payment, I acknowledge and agree to the following:</p>

          <div>
            <p className="text-white font-medium mb-1">1. Digital Product Delivery</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The product being purchased is a digital product and will be delivered electronically after successful payment confirmation.</li>
              <li>No physical item will be shipped.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">2. No Refund Policy</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Due to the nature of digital products, all sales are final.</li>
              <li>Refunds, returns, exchanges, or cancellations are not available once the product has been delivered or accessed, except where required by applicable law.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">3. Personal Use License</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The purchased product is licensed for personal or authorized business use only, as specified by the seller.</li>
              <li>Redistribution, resale, sharing, sublicensing, copying, or unauthorized distribution of the product is strictly prohibited.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">4. Intellectual Property Rights</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>All copyrights, trademarks, and intellectual property rights related to the product remain the property of the seller.</li>
              <li>Purchasing the product does not transfer ownership of any intellectual property rights.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">5. Product Access</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>It is the customer's responsibility to provide a valid email address and ensure the ability to receive digital files.</li>
              <li>The seller is not responsible for issues caused by incorrect customer information.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">6. Technical Requirements</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Customers are responsible for ensuring that their device, software, and internet connection are compatible with the purchased digital product.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">7. Limitation of Liability</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The seller shall not be liable for any indirect, incidental, consequential, or special damages arising from the use or inability to use the purchased product.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">8. Fraudulent Activity</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Any chargeback, unauthorized payment dispute, product sharing, piracy, or fraudulent activity may result in suspension of access and appropriate legal action.</li>
            </ul>
          </div>

          <div>
            <p className="text-white font-medium mb-1">9. Acceptance of Terms</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>By checking this box and completing the purchase, I confirm that I have read, understood, and agreed to these Terms & Conditions.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-6 rounded-md bg-white text-neutral-950 font-dm-sans font-semibold text-[13px] hover:bg-white/90 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
