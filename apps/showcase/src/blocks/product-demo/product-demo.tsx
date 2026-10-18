import { VideoPlayer } from "@nuvui/media";
import { Button } from "@nuvui/react";
import "./product-demo.scss";

// "Acme" and what it does are made up. The clip was made for the nuvui
// docs, and stands in for a recording of your product.
export default function ProductDemo() {
  return (
    <section className="product-demo" aria-labelledby="product-demo-title">
      <div className="product-demo__inner">
        <p className="product-demo__eyebrow">See it in two minutes</p>
        <h1 className="product-demo__title" id="product-demo-title">
          From a blank page to a screen your team can use
        </h1>
        <p className="product-demo__lead">
          Watch a screen built from the parts Acme gives you, with the data
          already in it, and shipped the same afternoon.
        </p>
        <div className="product-demo__actions">
          <Button asChild size="lg">
            <a href="#start">Start free</a>
          </Button>
          <Button asChild size="lg" intent="secondary">
            <a href="#demo">Book a demo</a>
          </Button>
        </div>
      </div>
      {/* Only the poster and a button until the first press, so the page
          loads no video for visitors who don't watch. */}
      <VideoPlayer
        className="product-demo__video"
        title="How a screen is built with Acme"
        src={[
          { src: "/clips/demo-720.webm", type: "video/webm" },
          { src: "/clips/demo-720.mp4", type: "video/mp4" },
        ]}
        poster="/clips/poster.jpg"
        tracks={[
          {
            kind: "captions",
            src: "/clips/captions.en.vtt",
            srcLang: "en",
            label: "English",
          },
        ]}
        facade
        ambient
      />
    </section>
  );
}
