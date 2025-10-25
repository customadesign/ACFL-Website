import React from 'react'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'


function testimonial() {
  return (
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-ink-dark dark:text-white mb-4">
              Client stories
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Real people, real transformations through ACT coaching
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Testimonial 1 - Sarah Martinez */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800  p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                My coach helped me work through anxiety that was holding me back for years. The ACT approach really clicked with me, and I finally feel like I'm living authentically. Highly recommend!
              </p>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">SM</span>
                </div>
                <div>
                  <div className="font-semibold text-ink-dark dark:text-white">Sarah Martinez</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Local Guide • 47 reviews
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Google • 3 months ago
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 2 - Michael Rodriguez */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800  p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                The matching process was incredible - they found me a coach who understood my specific challenges. Three months later, I feel more confident and focused than ever. Worth every penny.
              </p>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">MR</span>
                </div>
                <div>
                  <div className="font-semibold text-ink-dark dark:text-white">Michael Rodriguez</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Local Guide • 29 reviews
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Google • 2 months ago
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Testimonial 3 - Jennifer Lee */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-6 shadow-md border border-gray-200 dark:border-gray-700"
            >
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                I was skeptical about online coaching, but the platform made it so easy to connect with my coach. The flexibility to message between sessions has been a game-changer. Amazing service!
              </p>

              {/* Reviewer Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">JL</span>
                </div>
                <div>
                  <div className="font-semibold text-ink-dark dark:text-white">Jennifer Lee</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Local Guide • 63 reviews
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Google • 1 month ago
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
  )
}

export default testimonial