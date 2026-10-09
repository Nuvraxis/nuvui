import { Separator } from "@nuvui/react";
import { Hexagon } from "lucide-react";
import "./footer.scss";

const groups = [
  {
    title: "Product",
    links: [
      { name: "Invoices", href: "#invoices" },
      { name: "Reminders", href: "#reminders" },
      { name: "Reports", href: "#reports" },
      { name: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#about" },
      { name: "Customers", href: "#customers" },
      { name: "Careers", href: "#careers" },
      { name: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Help",
    links: [
      { name: "Docs", href: "#docs" },
      { name: "Changelog", href: "#changelog" },
      { name: "Service status", href: "#status" },
    ],
  },
];

const legal = [
  { name: "Terms", href: "#terms" },
  { name: "Privacy", href: "#privacy" },
  { name: "Security", href: "#security" },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div className="footer__about">
            <a className="footer__brand" href="#home">
              <Hexagon aria-hidden="true" size={22} />
              Acme
            </a>
            <p className="footer__text">
              Invoices sent, tracked and chased, so the month closes on time.
            </p>
          </div>
          {groups.map((group) => (
            // Each list is a landmark of its own, named by its heading.
            <nav
              key={group.title}
              className="footer__group"
              aria-labelledby={`footer-${group.title.toLowerCase()}`}
            >
              <h2
                className="footer__heading"
                id={`footer-${group.title.toLowerCase()}`}
              >
                {group.title}
              </h2>
              <ul className="footer__list">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <a className="footer__link" href={link.href}>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <Separator />
        <div className="footer__foot">
          <p className="footer__note">Acme, Inc. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="footer__legal">
              {legal.map((link) => (
                <li key={link.href}>
                  <a className="footer__link" href={link.href}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
