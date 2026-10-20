// Open.tsx
import { useState } from 'react';
import { motion } from "motion/react";
import { useScrollLock } from '@/hook/useScrollLock';  // Adjust path based on your folders

interface OpenProps {
    isOpen: boolean;
    onOpen: () => void;
}

export default function Open({ isOpen, onOpen }: OpenProps) {
    const [isGone, setIsGone] = useState(false);

    // Activates the extracted scroll lock logic
    useScrollLock(!isOpen);

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Wax Stamp */}
            <motion.div
                className={`fixed left-1/2 top-1/2 z-50 w-40 md:w-60 -translate-x-1/2 -translate-y-1/2 cursor-pointer ${isOpen ? "pointer-events-none" : "pointer-events-auto"
                    }`}
                onClick={onOpen}
                initial="normal"
                animate={isOpen ? "open" : "normal"}
                whileHover={isOpen ? undefined : "hover"}
                whileTap={isOpen ? undefined : "tap"}
            >
                {/* Blurred image behind */}
                <motion.img
                    src="Images/waxstamp.png"
                    className="absolute inset-0 w-full brightness-200 pointer-events-none"
                    variants={{
                        normal: { scale: 1, opacity: 1, filter: "blur(50px)" },
                        hover: { scale: 1.1, opacity: 1, filter: "blur(100px)" },
                        tap: { scale: 1 },
                        open: { scale: 0.5, opacity: 0, filter: "blur(100px)" }
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    alt=""
                />

                {/* Sharp image */}
                <motion.img
                    src="Images/waxstamp.png"
                    className="relative z-10 w-full pointer-events-none"
                    variants={{
                        normal: { scale: 1, opacity: 1 },
                        hover: { scale: 1.1 },
                        tap: { scale: 1 },
                        open: { scale: 0.5, opacity: 0 }
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    alt="Wax Stamp"
                />
            </motion.div>



            {/* Front Paper Animation */}
            {!isGone && (
                <div className="fixed inset-0 z-30 grid grid-cols-2 overflow-hidden">
                    <motion.div
                        className="relative h-full overflow-hidden shadow-[inset_-12px_0_20px_-14px_rgba(0,0,0,0.65)]"
                        initial={{ x: "0%" }}
                        animate={isOpen ? { x: "-100vw" } : { x: "0%" }}
                        transition={{ duration: 5, ease: "easeInOut" }}
                    >
                        <img
                            src="Images/damask.webp"
                            className="absolute inset-y-0 left-full h-full w-[max(100vw,71.43vh)] max-w-none -translate-x-1/2 object-cover max-[640px]:w-screen max-[640px]:object-fill"
                            alt="Left Paper"
                        />
                    </motion.div>

                    <motion.div
                        className="relative h-full overflow-hidden shadow-[inset_12px_0_20px_-14px_rgba(0,0,0,0.65)]"
                        initial={{ x: "0%" }}
                        animate={isOpen ? { x: "100vw" } : { x: "0%" }}
                        transition={{ duration: 5, ease: "easeInOut" }}
                    >
                        <img
                            src="Images/damask.webp"
                            className="absolute inset-y-0 left-0 h-full w-[max(100vw,71.43vh)] max-w-none -translate-x-1/2 scale-x-[-1] object-cover max-[640px]:w-screen max-[640px]:object-fill"
                            alt="Right Paper"
                        />
                    </motion.div>
                </div>
            )}
        </div>
    );
}
