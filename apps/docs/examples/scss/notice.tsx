import "./notice.scss";

export default function Example() {
  return (
    <div className="billing-notice">
      <p>Your card ends in 4242 and expires next month.</p>
      <a className="billing-notice__link" href="#the-mixins">
        Update card
      </a>
    </div>
  );
}
