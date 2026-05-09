import { motion } from 'framer-motion';
import { Phone, Mail, User, MessageCircle } from 'lucide-react';

const contacts = [
  {
    name: 'Hiranmoy Mondal',
    phone: '6290347173',
    email: 'hiranmoymondal587@gmail.com',
    role: 'Property Consultant',
    initials: 'HM',
    gradient: 'from-violet-500 to-indigo-600',
  },
  {
    name: 'Jyotirmay Mondal',
    phone: '9230119315',
    email: 'jyotirmaym007@gmail.com',
    role: 'Sales Manager',
    initials: 'JM',
    gradient: 'from-sky-500 to-cyan-600',
  },
  {
    name: 'Subhrojyoti Pyne',
    phone: '8617708968',
    email: 'subhrojyotipyne2001@gmail.com',
    role: 'Senior Property Advisor',
    initials: 'SP',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Wrick Khan',
    phone: '9674460315',
    email: 'wrickkhan@gmail.com',
    role: 'Customer Relations',
    initials: 'WK',
    gradient: 'from-amber-500 to-orange-500',
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Contact() {
  return (
    <div className="min-h-[70vh]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
          <MessageCircle className="w-4 h-4" />
          Get in Touch
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-3">
          Our <span className="bg-gradient-to-r from-primary-600 to-purple-600 dark:from-primary-400 dark:to-purple-400 bg-clip-text text-transparent">Team</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg max-w-xl mx-auto">
          Reach out to any of our dedicated property advisors — we're here to help you find your perfect home.
        </p>
      </motion.div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {contacts.map((c, i) => (
          <motion.div
            key={c.name}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="card p-6 flex flex-col items-center text-center group hover:-translate-y-1 transition-all duration-300 hover:shadow-card-hover dark:hover:shadow-card-hover-dark"
          >
            {/* Avatar */}
            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${c.gradient} flex items-center justify-center text-white text-2xl font-black shadow-lg mb-4 group-hover:scale-105 transition-transform duration-300`}>
              {c.initials}
            </div>

            {/* Name & Role */}
            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{c.name}</h3>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-full mb-5">
              {c.role}
            </span>

            {/* Contact Info */}
            <div className="w-full space-y-3">
              <a
                href={`tel:${c.phone}`}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group/item"
              >
                <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors">
                  {c.phone}
                </span>
              </a>

              {c.email ? (
                <a
                  href={`mailto:${c.email}`}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors group/item"
                >
                  <span className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  </span>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors truncate">
                    {c.email}
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50/50 dark:bg-gray-800/30">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700/40 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </span>
                  <span className="text-xs text-gray-400 italic">Email not available</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="text-center mt-14"
      >
        <div className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/60 px-5 py-3 rounded-2xl">
          <User className="w-4 h-4 text-primary-500" />
          Our team is available <span className="font-semibold text-gray-700 dark:text-gray-200 mx-1">Monday – Saturday, 9 AM – 7 PM</span> IST
        </div>
      </motion.div>
    </div>
  );
}
