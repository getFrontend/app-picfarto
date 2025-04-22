import { motion } from "framer-motion";
import { Github } from "lucide-react";

const Footer = () => {
  return (
    <motion.footer
      className="mt-12 flex items-center justify-between gap-2 text-center text-sm text-gray-500 dark:text-gray-400"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <p>
        © {new Date().getFullYear()} - Image Grid Cutter app by {}
        <span className="font-semibold">Sergey</span>
      </p>

      <motion.a
        href="https://github.com/getFrontend"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 rounded-full p-2 hover:bg-white/20 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Github className="h-4 w-4" />
      </motion.a>
    </motion.footer>
  );
};

export default Footer;
