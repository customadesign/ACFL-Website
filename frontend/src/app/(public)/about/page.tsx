"use client";

import NavbarLandingPage from "@/components/NavbarLandingPage";
import Testimonial from "../component/testimonial";
import Contact from "../component/contactUs";
import Footer from "@/components/Footer";
import {
  Users,
  TrendingUp,
  Globe,
  ArrowRight,
  Video,
  MessageCircle,
  Image,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      <section className="py-12 md:py-16 lg:py-20 bg-[url('/images/AboutHeaderImg.jpg')] bg-cover bg-center bg-no-repeat">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
          {/* Label */}
          <p className="text-sm text-gray-300 uppercase tracking-wider mb-6">
            Transform
          </p>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
            Your path to meaningful change
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-3xl mx-auto">
            Discover personalized coaching that helps you navigate life's
            challenges with purpose and clarity.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold px-8 py-3 rounded-lg transition-colors w-full sm:w-auto">
              Start assessment
            </button>
            <button className="bg-transparent hover:bg-white/10 text-white font-semibold px-8 py-3 rounded-lg border border-white/30 hover:border-white/50 transition-all w-full sm:w-auto">
              Learn more
            </button>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Our story of helping people find their way{" "}
              </h1>
              <p className="text-gray-600 text-lg mb-8">
                Founded by experienced psychologists, ACT Coaching for Life
                emerged from a deep understanding of human potential. We believe
                in empowering individuals to live with intention and overcome
                obstacles.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors">
                  Our approach
                </button>
                <button className="bg-transparent hover:bg-white/50 text-gray-800 font-medium px-6 py-3 rounded-lg border border-transparent hover:border-gray-300 transition-all inline-flex items-center">
                  Learn more
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:pl-12">
              <img
                src="/images/coaching-hero.png"
                alt="Our Story"
                className="w-full h-96 object-cover shadow-lg rounded-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-[#e9f6f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <p className="text-sm text-gray-600 uppercase tracking-wider mb-4">
                Science
              </p>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Evidence-based coaching for real transformation
              </h1>
              <p className="text-gray-600 text-lg mb-8">
                Acceptance and Commitment Therapy provides a proven framework
                for personal growth and psychological flexibility.
              </p>

              {/* Benefits List */}
              <ul className="space-y-3 mb-10">
                <li className="flex items-start">
                  <span className="text-gray-700 text-base">
                    • Understand your values
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700 text-base">
                    • Build psychological resilience
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-700 text-base">
                    • Create meaningful life changes
                  </span>
                </li>
              </ul>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button className="bg-white hover:bg-gray-50 text-gray-800 font-medium px-6 py-3 rounded-lg border border-gray-300 transition-colors">
                  Learn more
                </button>
                <button className="bg-transparent hover:bg-white/50 text-gray-800 font-medium px-6 py-3 rounded-lg border border-transparent hover:border-gray-300 transition-all inline-flex items-center">
                  Get started
                  <ArrowRight size={18} className="ml-2" />
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="lg:pl-12">
              <img
                src="/images/why-coaching-1.png"
                alt="Evidence-based Coaching"
                className="w-full h-96 object-cover shadow-lg rounded-lg"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-white">
        {" "}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-16">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-4">
              Innovative
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How we support your journey
            </h1>
            <p className="text-gray-600 text-lg">
              Personalized coaching tailored to your unique needs and goals.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Matching */}
            <div className="bg-gray-50 border border-gray-300 flex flex-col justify-between">
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Matching
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Intelligent coach matching within 24 hours
                </h2>
                <p className="text-gray-600 mb-6">
                  Find your perfect coaching match quickly and easily.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Explore matching
                  <ArrowRight size={16} className="ml-2" />
                </a>
              </div>

              {/* Image */}
              <div className="mt-4">
                <img
                  src="/images/why-coaching-2.png"
                  alt="Intelligent Matching"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Card 2: Flexible */}
            <div className="bg-gray-50 border border-gray-300 flex flex-col justify-between">
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Flexible
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Multiple session formats{" "}
                </h2>
                <p className="text-gray-600 mb-6">
                  Video, phone, and text coaching to fit your lifestyle.{" "}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  View options <ArrowRight size={16} className="ml-2" />
                </a>
              </div>

              {/* Image */}
              <div className="mt-4">
                <img
                  src="/images/why-coaching-3.png"
                  alt="Multiple Session Formats"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Card 3: Support */}
            <div className="bg-gray-50 border border-gray-300 flex flex-col justify-between">
              <div className="p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">
                  Support
                </p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Continuous guidance and messaging{" "}
                </h2>
                <p className="text-gray-600 mb-6">
                  Stay connected with your coach between sessions.{" "}
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm text-gray-700 hover:text-gray-900 font-medium"
                >
                  Learn more <ArrowRight size={16} className="ml-2" />
                </a>
              </div>

              {/* Image */}
              <div className="mt-4">
                <img
                  src="/images/why-coaching-4.png"
                  alt="Continuous Guidance"
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our impact goes beyond numbers
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              We measure success through the lives we've touched and
              transformed. Our commitment to evidence-based coaching drives
              continuous improvement and meaningful change.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Lives Changed */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-gray-200 px-8 py-14 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-6xl font-bold text-gray-900 mb-3">
                    3,000+
                  </h2>
                  <p className="text-lg text-gray-700 font-medium">
                    Lives changed
                  </p>
                </div>
              </div>

              {/* Lives Changed Image */}
              <div className="bg-white border border-gray-200 hover:shadow-lg transition-shadow overflow-hidden">
                <img
                  src="/images/lives-changed.png"
                  alt="Lives Changed Impact"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Image Card */}
              <div className="bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/coaching-numbers.png"
                  alt="Growth Statistics"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Certified Coaches */}
              <div className="bg-white border border-gray-200 px-8 py-14 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-6xl font-bold text-gray-900 mb-3">
                    150+
                  </h2>
                  <p className="text-lg text-gray-700 font-medium">
                    Certified coaches
                  </p>
                </div>
              </div>
            </div>
            {/* Countries Served */}
            <div className="flex flex-col gap-4">
              <div className="bg-white border border-gray-200 px-8 py-14 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <h2 className="text-6xl font-bold text-gray-900 mb-3">25+</h2>
                  <p className="text-lg text-gray-700 font-medium">
                    Countries served
                  </p>
                </div>
              </div>

              {/* Image Card */}
              <div className="bg-gray-100 flex items-center justify-center overflow-hidden">
                <img
                  src="/images/why-coaching-5.png"
                  alt="Global Reach"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>{" "}
      </section>
      <Testimonial />
      <Contact />
      <Footer />
    </div>
  );
}
