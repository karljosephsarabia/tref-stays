import { motion } from "framer-motion";
import { Shield, Clock, Headphones, BadgePercent } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Properties",
    description: "Every listing is verified for quality and safety standards",
    gradient: "from-primary/20 to-tref-teal/20",
    iconColor: "text-primary",
    borderColor: "border-primary/30 hover:border-primary/50",
  },
  {
    icon: Clock,
    title: "Instant Booking",
    description: "Book your stay instantly with our streamlined process",
    gradient: "from-tref-purple/20 to-primary/20",
    iconColor: "text-tref-purple",
    borderColor: "border-tref-purple/30 hover:border-tref-purple/50",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our team is always available to help with any concerns",
    gradient: "from-tref-orange/20 to-tref-gold/20",
    iconColor: "text-tref-orange",
    borderColor: "border-tref-orange/30 hover:border-tref-orange/50",
  },
  {
    icon: BadgePercent,
    title: "Best Price Guarantee",
    description: "We match any competitor's price on identical properties",
    gradient: "from-tref-teal/20 to-tref-purple/20",
    iconColor: "text-tref-teal",
    borderColor: "border-tref-teal/30 hover:border-tref-teal/50",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const TrustSection = () => {
  return (
    <section className="relative py-10 md:py-16 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/20 pointer-events-none" />
      {/* Decorative shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-tref-purple/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-primary font-semibold text-xs md:text-sm uppercase tracking-wide mb-2">
            Why Choose Us
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Trusted by Thousands
          </h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="text-center"
            >
              <motion.div
                className={`relative rounded-2xl border-2 ${feature.borderColor} bg-gradient-to-br ${feature.gradient} p-6 md:p-8 transition-all duration-300 overflow-hidden group`}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <motion.div
                  className={`relative w-12 h-12 md:w-14 md:h-14 mx-auto mb-3 md:mb-4 rounded-xl bg-white/80 shadow-md flex items-center justify-center ${feature.iconColor}`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  <feature.icon className="h-6 w-6 md:h-7 md:w-7" />
                </motion.div>
                <h3 className="relative font-semibold text-sm md:text-lg mb-1 md:mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="relative text-muted-foreground text-xs md:text-sm leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TrustSection;
