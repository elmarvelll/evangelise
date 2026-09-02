import { motion } from "framer-motion";

export default function LoadingBar() {
  return (
    <div className="relative h-4 w-full overflow-hidden rounded-md bg-gray-300">
      <motion.div
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
        animate={{
          x: ["-100%", "400%"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}