import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { CountUp } from "@/components/CountUp";
import {
  Shield,
  Clock,
  Headphones,
  BadgePercent,
  Target,
  Eye,
  Heart,
  Users,
  Zap,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
} from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};
const stagger = { staggerChildren: 0.08, delayChildren: 0.1 };

const stats = [
  { value: "10K+", label: "Properties" },
  { value: "50K+", label: "Happy Guests" },
  { value: "100+", label: "Cities" },
  { value: "4.9★", label: "Rating" },
];

const whyChoose = [
  {
    icon: Shield,
    title: "Verified Properties",
    description: "Every listing passes our quality and safety checks. We verify ownership, photos, and amenities so you can book with confidence.",
    gradient: "from-primary/20 to-tref-teal/20",
    iconColor: "text-primary",
  },
  {
    icon: Clock,
    title: "Instant Booking",
    description: "See availability in real time and confirm your stay instantly. No waiting for host approval on eligible properties.",
    gradient: "from-tref-purple/20 to-primary/20",
    iconColor: "text-tref-purple",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is available around the clock via chat, email, or phone. We're here to help before, during, and after your stay.",
    gradient: "from-tref-orange/20 to-tref-gold/20",
    iconColor: "text-tref-orange",
  },
  {
    icon: BadgePercent,
    title: "Best Price Guarantee",
    description: "Found a lower price elsewhere? We'll match it. Our guarantee ensures you always get the best deal on identical properties.",
    gradient: "from-tref-teal/20 to-tref-purple/20",
    iconColor: "text-tref-teal",
  },
];

const values = [
  { icon: Shield, title: "Trust & Transparency", description: "We build trust through honest listings and clear policies." },
  { icon: Heart, title: "Customer First", description: "Your experience and satisfaction guide every decision we make." },
  { icon: Zap, title: "Innovation", description: "We continuously improve our platform to serve you better." },
  { icon: Users, title: "Community Building", description: "We connect travelers and hosts to create lasting value." },
];

const team = [
  { name: "Sarah Chen", role: "CEO & Co-Founder", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop" },
  { name: "Michael Torres", role: "Head of Product", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop" },
  { name: "Emily Watson", role: "Head of Operations", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop" },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero */}
      <section className="relative min-h-[50vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-tref-purple/80" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920')] bg-cover bg-center opacity-20 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <motion.div
          className="relative z-10 text-center max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            About Tref
          </h1>
          <p className="text-lg md:text-xl text-white/90">
            Your perfect rental home, everywhere.
          </p>
        </motion.div>
      </section>

      {/* Our Story */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">Our Story</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Tref was founded in 2020 with a simple mission: make finding the perfect rental home easy, transparent, and enjoyable. We started when we saw travelers and relocators struggling with scattered listings and unclear policies.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Today we help thousands of guests find short-term and long-term rentals—and help property owners reach guests they can trust. Whether you're planning a vacation, a move, or listing your own property, Tref is here to help.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We're building the most trusted rental platform by putting quality listings, clear communication, and fair policies first.
              </p>
            </motion.div>
            <motion.div
              variants={fadeInUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative rounded-2xl overflow-hidden shadow-xl aspect-[4/3] max-h-[400px]"
            >
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop"
                alt="Modern home"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Mission & Vision
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <motion.div
              className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/15 to-tref-teal/15 p-8 shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -4 }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                Help people discover unique stays and experiences around the world. We make it easy to find, book, and enjoy rental homes—whether for a weekend or a year.
              </p>
            </motion.div>
            <motion.div
              className="rounded-2xl border-2 border-tref-purple/30 bg-gradient-to-br from-tref-purple/15 to-tref-gold/15 p-8 shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="w-14 h-14 rounded-xl bg-tref-purple/20 flex items-center justify-center mb-6">
                <Eye className="h-7 w-7 text-tref-purple" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                Become the most trusted rental platform globally. We aim to set the standard for quality, transparency, and support in the short-term and long-term rental space.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Tref */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center text-foreground mb-4"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why Choose Tref
          </motion.h2>
          <motion.p
            className="text-muted-foreground text-center max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            We combine technology with a human touch to give you the best rental experience.
          </motion.p>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {whyChoose.map((item) => (
              <motion.div
                key={item.title}
                variants={fadeInUp}
                className={`rounded-2xl border-2 ${item.gradient} bg-gradient-to-br ${item.gradient} p-6 hover:shadow-lg transition-all duration-300`}
                whileHover={{ y: -4 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center mb-4 ${item.iconColor}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-br from-primary/10 via-tref-purple/5 to-tref-gold/10">
        <div className="container mx-auto max-w-5xl">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Tref by the Numbers
          </motion.h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center p-6 rounded-2xl bg-white/80 backdrop-blur border border-border shadow-md hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                  <CountUp value={stat.value} duration={1.5} />
                </div>
                <div className="text-sm text-muted-foreground font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Our Values
          </motion.h2>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            {values.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeInUp}
                className="rounded-2xl border border-border bg-card p-6 text-center hover:border-primary/40 hover:shadow-lg transition-all"
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Meet Our Team
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, i) => (
              <motion.div
                key={member.name}
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="relative rounded-2xl overflow-hidden aspect-square max-w-[280px] mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="font-bold text-foreground">{member.name}</h3>
                <p className="text-sm text-primary font-medium">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-tref-purple/80 p-8 md:p-12 text-center text-white shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Find Your Perfect Home?</h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Browse thousands of verified properties or list your own. We're here to help every step of the way.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 shadow-lg">
                  Browse Properties
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/list-property">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2">
                  List Your Property
                </Button>
              </Link>
            </div>
            <div className="mt-10 pt-8 border-t border-white/20 flex flex-wrap justify-center gap-8 text-sm text-white/90">
              <a href="mailto:hello@tref.com" className="flex items-center gap-2 hover:text-white transition-colors">
                <Mail className="h-4 w-4" />
                hello@tref.com
              </a>
              <a href="tel:+15551234567" className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                +1 (555) 123-4567
              </a>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                New York, NY
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
