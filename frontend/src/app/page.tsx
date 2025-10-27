"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import ShinyText from "@/components/ShinyText";
import Footer from "@/components/Footer";
import Ballpit from "@/components/Ballpit";
import {
  Star,
  ChevronRight,
  ArrowRight,
  Globe,
  Sprout,
  Users,
} from "lucide-react";
import NavbarLandingPage from "@/components/NavbarLandingPage";
import AssessmentCompleteModal from "@/components/AssessmentCompleteModal";
import Testimonial from "./(public)/component/testimonial";
import Contact from "./(public)/component/contactUs";
import imgone from "./(public)/images/HomeImg1.png";
import imgtwo from "./(public)/images/HomeImg2.png";
import imgthree from "./(public)/images/HomeImg3.png";
import imgfour from "./(public)/images/HomeImg4.png";

export default function HomePage() {
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-20 bg-[#e9f6f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left"
            >
              <h1 className="text-4xl md:text-5xl lg:text-5xl font-bold text-ink-dark dark:text-white mb-6 leading-tight">
                Find the Perfect Coach for Meaningful Change
              </h1>
              <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                Professional ACT coaching that helps you overcome challenges,
                build resilience, and create meaningful life changes. Get
                matched with qualified coaches in 24 hours.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col  sm:flex-row gap-4 mb-8 items-center">
                <a href="/assessment">
                  <button className="flex items-center border-2 border-gray-300 rounded-md text-black px-6 py-3 w-full sm:w-auto">
                    Get Started Today
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </a>
                <a href="/assessment">
                  <button className="flex items-center rounded-md text-black px-6 py-3 w-full sm:w-auto">
                    Watch Video
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </a>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative overflow-hidden shadow-2xl">
                <img
                  src={imgone.src}
                  alt="Professional ACT coaching session"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-wider text-gray-600 mb-4">
              Coaching
            </p>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Why choose ACT coaching
            </h1>
            <p className="text-xl text-gray-600">
              Proven strategies for personal and professional growth
            </p>
          </div>

          {/* Cards Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Card 1 - Evidence-based approach (with hover state) */}
            <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer flex-1 transition-all duration-500 lg:hover:flex-[2]">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="Modern office"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 group-hover:from-black/80 group-hover:to-black/40 transition-all duration-300"></div>
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                <div>
                  <h2 className="text-3xl font-bold mb-4">
                    Evidence-based approach
                  </h2>
                  <p className="text-sm text-gray-200 mb-6">
                    We promise three to five perfectly matched coaches within 24
                    hours.
                  </p>
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    Learn more
                  </button>
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors flex items-center gap-2">
                    How it works
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 - Flexible session formats */}
            <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer flex-1 transition-all duration-500 lg:hover:flex-[2]">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                alt="Coaching session"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 group-hover:from-black/80 group-hover:to-black/40 transition-all duration-300"></div>
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                <div>
                  <h2 className="text-3xl font-bold mb-4">
                    Flexible session formats
                  </h2>
                  <p className="text-sm text-gray-200 mb-6">
                    Scientifically validated techniques that drive real, lasting
                    change.
                  </p>
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    Learn more
                  </button>
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors flex items-center gap-2">
                    How it works
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3 - Flexible session formats */}
            <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer flex-1 transition-all duration-500 lg:hover:flex-[2]">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                alt="Mobile coaching"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 group-hover:from-black/80 group-hover:to-black/40 transition-all duration-300"></div>
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                <div>
                  <h2 className="text-3xl font-bold mb-4">
                    Flexible session formats
                  </h2>
                  <p className="text-sm text-gray-200 mb-6">
                    Video, phone, and text coaching to fit your lifestyle and
                    preferences.
                  </p>
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    Learn more
                  </button>
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors flex items-center gap-2">
                    How it works
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-[#e9f6f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className=" overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 md:p-10 lg:p-16">
              {/* Left Content Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8 lg:space-y-10 flex flex-col justify-center"
              >
                {/* Personal Growth */}
                <div className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Sprout className="w-6 h-6 md:w-7 md:h-7 text-slate-700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
                      Personal growth
                    </h3>
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                      Develop resilience and emotional intelligence through
                      targeted psychological strategies.
                    </p>
                  </div>
                </div>

                {/* Accessibility */}
                <div className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 md:w-7 md:h-7 text-slate-700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
                      Accessibility
                    </h3>
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                      Coaching available globally, with sessions in multiple
                      languages and time zones.
                    </p>
                  </div>
                </div>

                {/* Holistic Support */}
                <div className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Globe className="w-6 h-6 md:w-7 md:h-7 text-slate-700" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold text-slate-900 mb-2">
                      Holistic support
                    </h3>
                    <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                      Comprehensive guidance addressing mental, emotional, and
                      professional development.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col  sm:flex-row gap-4 mb-8 items-center">
                  <a href="/assessment">
                    <button className="flex items-center border-2 border-gray-300 rounded-md text-black px-6 py-3 w-full sm:w-auto">
                      Get Started
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </a>
                  <a href="/assessment">
                    <button className="flex items-center rounded-md text-black px-6 py-3 w-full sm:w-auto">
                      Explore Benefits
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </a>
                </div>
              </motion.div>

              {/* Right Image Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative order-first lg:order-last"
              >
                <div className="relative overflow-hidden shadow-2xl aspect-[4/3] lg:aspect-auto lg:h-full">
                  <img
                    src={imgtwo.src}
                    alt="Person working on laptop with cozy workspace setup"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-wider text-gray-600 mb-4">
              Services
            </p>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Coaching solutions for every need
            </h1>
            <p className="text-xl text-gray-600">
              Personalized support across individual, group, and corporate
              programs
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Card 1 - Individual coaching plans */}
            <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer flex-1 transition-all duration-500 lg:hover:flex-[2]">
              <img
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"
                alt="Individual coaching"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 group-hover:from-black/80 group-hover:to-black/40 transition-all duration-300"></div>
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                <div>
                  <p className="text-sm text-gray-300 mb-2">Recommended</p>
                  <h2 className="text-3xl font-bold mb-4">
                    Individual coaching plans
                  </h2>
                  <p className="text-sm text-gray-200 mb-6">
                    Tailored one-on-one sessions addressing personal growth and
                    specific challenges.
                  </p>
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    View plans
                  </button>
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    Book consultation →
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2 - Group coaching programs */}
            <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer flex-1 transition-all duration-500 lg:hover:flex-[2]">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"
                alt="Group coaching"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 group-hover:from-black/80 group-hover:to-black/40 transition-all duration-300"></div>
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                <div>
                  <h2 className="text-3xl font-bold mb-4">
                    Group coaching programs
                  </h2>
                  <p className="text-sm text-gray-200 mb-6">
                    Collaborative sessions focusing on shared goals and
                    collective growth.
                  </p>
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    Explore groups →
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3 - Corporate wellness programs */}
            <div className="relative h-80 rounded-lg overflow-hidden group cursor-pointer flex-1 transition-all duration-500 lg:hover:flex-[2]">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"
                alt="Corporate wellness"
                className="absolute inset-0 w-full h-full object-cover brightness-50"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30 group-hover:from-black/80 group-hover:to-black/40 transition-all duration-300"></div>
              <div className="relative h-full p-8 flex flex-col justify-between text-white">
                <div>
                  <h2 className="text-3xl font-bold mb-4">
                    Corporate wellness programs
                  </h2>
                  <p className="text-sm text-gray-200 mb-6">
                    Organizational solutions for leadership development and team
                    performance.
                  </p>
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="text-sm px-4 py-2 bg-white/20 hover:bg-white/30 rounded transition-colors">
                    Contact sales →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="py-12 md:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3">
              Impact
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our coaching by the numbers
            </h1>
            <p className="text-gray-600 text-lg">
              Transformative results across personal and professional domains
            </p>
          </motion.div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-6 gap-8 items-center">
            {/* Statistics Cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="md:col-span-2 space-y-5"
            >
              <div className="bg-white shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                  3,000+
                </div>
                <p className="text-gray-700 font-medium text-lg">
                  Active clients worldwide
                </p>
              </div>

              <div className="bg-white  shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                  150+
                </div>
                <p className="text-gray-700 font-medium text-lg">
                  Certified ACT coaches
                </p>
              </div>

              <div className="bg-white  shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow text-center">
                <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                  25+
                </div>
                <p className="text-gray-700 font-medium text-lg">
                  Countries served
                </p>
              </div>
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="md:col-span-4 shadow-lg"
            >
              <img
                src={imgthree.src}
                alt="Professional coaching session"
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Client Stories Section */}
      <Testimonial />
      {/* Start Your Transformation Today Section */}
      <section className="bg-white min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-center gap-4"
          >
            <div className="flex flex-col gap-4 text-center mb-16">
              <h1 className="text-4xl">Start your transformation today</h1>
              <p>
                Unlock your potential with personalized coaching matched to your
                unique journey
              </p>
              <div className="flex justify-center gap-2">
                <button className="bg-[#25a7b8] text-white rounded-md p-2">
                  Take Assessment
                </button>
                <button className="border border-gray-400 rounded-md p-2">
                  Learn More
                </button>
              </div>
            </div>
          </motion.div>
          <motion.img
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            src={imgfour.src}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      </section>

      {/* Contact Us Section */}
      <Contact />
      {/* Footer */}
      <Footer />
      {/* Assessment Complete Modal */}
      <AssessmentCompleteModal
        isOpen={showAssessmentModal}
        onClose={() => setShowAssessmentModal(false)}
      />
    </div>
  );
}
