import { motion } from "framer-motion";
import Image from "next/image";
import { ThemeToggle } from "./ui/theme-toggle";

const Header = () => {
  return (
    <motion.header
      className="mb-8 text-center relative"
      initial={{ y: -20 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.1, type: "spring" }}
    >
      <div className="absolute right-0 top-0">
        <ThemeToggle />
      </div>
      <h1 className="flex gap-2 items-center justify-center mb-2">
        <Image
          src="/images/logo-picfarto.png"
          alt="Logo Picfarto"
          width={42}
          height={42}
        />
        <span className="text-3xl font-bold mb-2">Image Grid Cutter</span>
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Upload an image, set your grid dimensions, and download the cut pieces
      </p>
    </motion.header>
  );
};

export default Header;
