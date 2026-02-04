import { Link } from "react-router-dom";
import trefLogo from "@/assets/tref-logo.png";

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
            <img src={trefLogo} alt="Tref" className="h-7 md:h-8 w-auto mb-3 md:mb-4" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              Find your perfect rental property. Short-term, long-term, or for sale.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Properties</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Short Term Rentals
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Long Term Rentals
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Properties for Sale
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Simche Halls
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-xs md:text-sm text-center sm:text-left">
              © 2026 Tref. All rights reserved.
            </p>
            <div className="flex items-center gap-4 md:gap-6">
              <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                Privacy
              </Link>
              <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                Terms
              </Link>
              <Link to="/" className="text-muted-foreground hover:text-primary text-xs md:text-sm transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
