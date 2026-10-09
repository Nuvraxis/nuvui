import Link from "next/link";
import { Logo } from "@/components/logo";
import { docs, navigation, site } from "@/lib/site";

const project = [
  { label: "GitHub", href: site.repo },
  { label: "Changelog", href: `${docs.home}/changelog` },
  { label: "License", href: `${site.repo}/blob/main/LICENSE` },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__about">
          <p className="site-footer__name">
            <Logo />
            {site.name}
          </p>
          <p className="site-footer__text">{site.description}</p>
        </div>
        <nav aria-labelledby="footer-library">
          <h2 id="footer-library" className="site-footer__heading">
            Library
          </h2>
          <ul className="site-footer__links">
            {navigation.map((item) => (
              <li key={item.href}>
                {item.docs ? (
                  <a className="site-footer__link" href={item.href}>
                    {item.label}
                  </a>
                ) : (
                  <Link className="site-footer__link" href={item.href}>
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-labelledby="footer-project">
          <h2 id="footer-project" className="site-footer__heading">
            Project
          </h2>
          <ul className="site-footer__links">
            {project.map((item) => (
              <li key={item.href}>
                <a className="site-footer__link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="site-footer__end">
        <p className="site-footer__note">
          {site.name} is open source, under the MIT license.
        </p>
      </div>
    </footer>
  );
}
