import { Facebook, Instagram, Linkedin, Youtube, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between gap-8 border border-gray-200 p-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-10">
            {/* Logo */}
          <div className="flex flex-col gap-4">
            <img
              src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
              alt="ACT Coaching for Life logo"
              width={90}
              height={90}
              className="select-none"
            />
            <h2 className="text-2xl font-serif font-bold mb-4">ACFL</h2>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Home</li>
              <li>Services</li>
              <li>Coaches</li>
              <li>Resources</li>
              <li>Link Five</li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2 text-gray-600">
              <li>FAQ</li>
              <li>Contact</li>
              <li>Help</li>
              <li>Chat</li>
              <li>Link Ten</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Privacy</li>
              <li>Terms</li>
              <li>Cookies</li>
              <li>Disclaimer</li>
              <li>Link Fifteen</li>
            </ul>
          </div>
          </div>

          {/* Subscribe */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Subscribe</h3>
            <p className="text-gray-600 text-sm mb-4">
              Get insights and updates on coaching strategies and mental
              wellness.
            </p>
            <form className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                placeholder="Enter email address"
                className="w-full sm:w-auto flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                type="submit"
                className="border border-gray-300 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
              >
                Submit
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-3">
              By subscribing, you agree to our privacy policy and email terms.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex justify-between flex-col lg:flex-row">
          <div className="flex flex-col md:flex-row justify-between items-center mt-8 text-sm text-gray-600 gap-4">
            <div className="text-center md:text-left">
              © 2024 ACT Coaching for Life. All rights reserved.
            </div>

            <div className="flex flex-wrap justify-center md:justify-end gap-6">
              <a href="#" className="hover:text-black">
                Privacy policy
              </a>
              <a href="#" className="hover:text-black">
                Terms of service
              </a>
              <a href="#" className="hover:text-black">
                Cookie settings
              </a>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex justify-center md:justify-end mt-6 space-x-5">
            <a href="#" className="hover:text-black">
              <Facebook />
            </a>
            <a href="#" className="hover:text-black">
              <Instagram />
            </a>
            <a href="#" className="hover:text-black">
              <Twitter />
            </a>
            <a href="#" className="hover:text-black">
              <Linkedin />
            </a>
            <a href="#" className="hover:text-black">
              <Youtube />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
