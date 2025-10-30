"use client";
import Footer from "@/components/Footer";
import NavbarLandingPage from "@/components/NavbarLandingPage";
import Contact from "../component/contactUs";
import Testimonial from "../component/testimonial";
import imgone from "../images/BlogImg1.jpg";
import imgtwo from "../images/HomeImg1.png";
import imgthree from "../images/HomeImg2.png";
import imgfour from "../images/HomeImg4.png";
import imgfive from "../images/HomeImg3.png";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

import React from "react";
import {
  Share2,
  Linkedin,
  X,
  Facebook,
  Link2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <nav>
        <NavbarLandingPage />
      </nav>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-[url('/images/corporate-hero.png')] bg-cover bg-center bg-no-repeat">
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-white/80 uppercase tracking-wider mb-6">
              Transform
            </p>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
              Group coaching for growth
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
              Unlock collective potential through evidence-based ACT coaching
              designed to help teams and individuals breakthrough personal and
              professional barriers{" "}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-8 py-6 text-lg font-semibold transition-all shadow-sm">
                  Explore
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-8 py-6 text-lg font-semibold transition-all shadow-md hover:shadow-lg">
                  Assessment
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Resilience
            </p>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Anxiety and stress
              <br />
              management coaching
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Evidence-based strategies to transform workplace stress and
              emotional challenges
            </p>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white border border-gray-300 shadow-sm overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Column - Text Content */}
              <div className="p-12">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Focused
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Comprehensive approach to mental wellness
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Our targeted program helps teams develop practical coping
                  mechanisms and emotional intelligence. We focus on sustainable
                  strategies that create lasting personal and professional
                  growth.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                    Enroll now
                  </button>
                  <button className="border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                    Learn more
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="min-h-[400px] overflow-hidden">
                <img
                  src={imgtwo.src}
                  alt="Mental wellness coaching"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Column - Text Content */}
              <div className="p-12">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Purpose
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Values-based living through mindful coaching
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Discover your core values and align your life with meaningful
                  action. Our program helps you break through personal barriers
                  and create authentic, purpose-driven experiences.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="px-6 py-3 bg-gray-900 text-white font-medium rounded-md hover:bg-gray-800 transition-colors">
                    Enroll
                  </button>
                  <button className="px-6 py-3 text-gray-900 font-medium rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
                    Learn more
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="min-h-[400px] overflow-hidden">
                <img
                  src={imgthree.src}
                  alt="Values-based living coaching"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg overflow-hidden"
          >
            <div className="grid md:grid-cols-5 gap-0">
              {/* Left Column - Image */}
              <div className="md:col-span-2 min-h-[300px] overflow-hidden">
                <img
                  src={imgfive.src}
                  alt="Workplace wellness coaching"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Right Column - Content */}
              <div className="md:col-span-3 p-8">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Performance
                </p>

                <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Workplace wellness for high-performing teams
                </h2>

                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  Transform workplace dynamics through evidence-based
                  psychological strategies. Our coaching builds resilient,
                  collaborative environments that drive organizational success.
                </p>

                {/* Bullet Points */}
                <ul className="space-y-2 mb-8">
                  <li className="flex items-start text-sm text-gray-700">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>
                      Enhance team cohesion through emotional intelligence
                    </span>
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Develop leadership potential</span>
                  </li>
                  <li className="flex items-start text-sm text-gray-700">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>Reduce workplace stress effectively</span>
                  </li>
                </ul>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                    Enroll
                  </button>
                  <button className="border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                    Learn
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Connect
            </p>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Relationship skills coaching
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Strengthen personal and professional connections
            </p>
          </motion.div>

          {/* Main Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white border border-gray-300 shadow-sm overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Column - Text Content */}
              <div className="p-12">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Focused
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Effective communication strategies
                </h2>
                <p className="text-gray-600 leading-relaxed mb-8">
                  Learn practical techniques to improve listening, empathy, and
                  meaningful dialogue. Build stronger, more authentic
                  relationships in all areas of life.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-3 font-medium transition-all shadow-md hover:shadow-lg">
                    Enroll now
                  </button>
                  <button className="border-2 border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-lg px-6 py-3 font-medium transition-all shadow-sm flex items-center gap-2">
                    Learn more
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="min-h-[400px] overflow-hidden">
                <img
                  src={imgone.src}
                  alt="Relationship skills coaching"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-lg p-12"
          >
            {/* Number Label */}
            <div className="flex items-center gap-3 mb-12">
              <span className="text-lg font-bold text-gray-900">01</span>
              <span className="text-sm font-medium text-gray-600">
                Community support
              </span>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Shared
                </p>

                <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Power of collective learning
                </h2>

                <p className="text-gray-600 leading-relaxed mb-8">
                  Group coaching creates a supportive environment where
                  participants learn from each other's experiences and
                  challenges. Gain insights through diverse perspectives.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-white text-gray-900 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                    Join
                  </button>
                  <button className="px-6 py-2 text-gray-900 text-sm font-medium rounded hover:bg-gray-50 transition-colors flex items-center gap-2">
                    Learn
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="min-h-[280px] overflow-hidden">
                <img
                  src={imgtwo.src}
                  alt="Community support"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-lg p-12"
          >
            {/* Number Label */}
            <div className="flex items-center gap-3 mb-12">
              <span className="text-lg font-bold text-gray-900">02</span>
              <span className="text-sm font-medium text-gray-600">
                Cost effective
              </span>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Efficient
                </p>

                <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Affordable path to personal growth
                </h2>

                <p className="text-gray-600 leading-relaxed mb-8">
                  Access high-quality coaching at a fraction of individual
                  session costs. Maximize your investment with structured,
                  comprehensive group programs.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-white text-gray-900 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                    Explore
                  </button>
                  <button className="px-6 py-2 text-gray-900 text-sm font-medium rounded hover:bg-gray-50 transition-colors flex items-center gap-2">
                    Discover
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="min-h-[280px] overflow-hidden">
                <img
                  src={imgthree.src}
                  alt="Cost effective coaching"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg p-12"
          >
            {/* Number Label */}
            <div className="flex items-center gap-3 mb-12">
              <span className="text-lg font-bold text-gray-900">03</span>
              <span className="text-sm font-medium text-gray-600">
                Accelerated progress
              </span>
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Column - Content */}
              <div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
                  Momentum
                </p>

                <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                  Rapid personal and professional development
                </h2>

                <p className="text-gray-600 leading-relaxed mb-8">
                  Leverage group dynamics to fast-track your growth. Receive
                  immediate feedback, accountability, and support from coaches
                  and peers.
                </p>

                {/* CTA Buttons */}
                <div className="flex gap-4">
                  <button className="px-6 py-2 bg-white text-gray-900 text-sm font-medium rounded border border-gray-300 hover:bg-gray-50 transition-colors">
                    Start
                  </button>
                  <button className="px-6 py-2 text-gray-900 text-sm font-medium rounded hover:bg-gray-50 transition-colors flex items-center gap-2">
                    Learn
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Right Column - Image */}
              <div className="min-h-[280px] overflow-hidden">
                <img
                  src={imgfive.src}
                  alt="Accelerated progress"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Testimonial />
      <section className="bg-white min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row justify-center gap-4"
          >
            <div className="flex flex-col gap-4 text-center mb-16">
              <h1 className="text-4xl">Get insights that transform</h1>
              <p>
                Stay updated with the latest ACT strategies and personal growth
                resources
              </p>
              <div className="flex justify-center gap-2">
                <button className="bg-[#25a7b8] text-white rounded-md p-2">
                  Subscribe{" "}
                </button>
                <button className="border border-gray-400 rounded-md p-2">
                  Explore{" "}
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
      <Contact />
      <Footer />
    </div>
  );
}
