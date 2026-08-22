const STEPS = [
  {
    title: "Browse by category",
    text: "Find cakes, crafts, food, and gifts from home businesses across Sri Lanka.",
  },
  {
    title: "Contact the maker",
    text: "Message on WhatsApp, call, or email. You deal directly with the seller.",
  },
  {
    title: "Arrange pickup or delivery",
    text: "Agree price and timing with the maker. Podimart does not take payment.",
  },
];

export function HowItWorks() {
  return (
    <section className="mall-section how-it-works">
      <div className="section-head">
        <h2>How ordering works</h2>
      </div>
      <div className="steps-grid">
        {STEPS.map((step, index) => (
          <article className="step-card" key={step.title}>
            <span className="step-num">{index + 1}</span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
