import { docs, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p className="site-footer__note">
          {site.name} is open source, under the MIT license.
        </p>
        <ul className="site-footer__links">
          <li>
            <a className="site-footer__link" href={docs.home}>
              Docs
            </a>
          </li>
          <li>
            <a className="site-footer__link" href={`${docs.home}/changelog`}>
              Changelog
            </a>
          </li>
          <li>
            <a className="site-footer__link" href={site.repo}>
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
