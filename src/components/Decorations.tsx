'use client'

import React from 'react'
import { motion } from 'framer-motion'

// 漂浮泡泡装饰
export const FloatingBubbles: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 10 }).map((_, i) => {
        const size = Math.random() * 30 + 10
        const delay = Math.random() * 5
        const duration = Math.random() * 15 + 10
        const left = `${Math.random() * 100}%`
        const opacity = Math.random() * 0.3 + 0.1
        
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-pink-light"
            style={{
              width: size,
              height: size,
              left,
              opacity,
              bottom: '-10%',
            }}
            animate={{
              y: [0, -window.innerHeight * 1.2],
              x: [0, (Math.random() - 0.5) * 100],
              rotate: [0, 360],
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )
      })}
    </div>
  )
}

// 粉色光晕效果
export const PinkGlow: React.FC<{ x?: number; y?: number }> = ({ x, y }) => {
  return (
    <motion.div
      className="absolute w-[300px] h-[300px] rounded-full bg-gradient-radial from-pink-light/30 to-transparent blur-3xl"
      style={{
        left: x ? `${x}px` : "50%",
        top: y ? `${y}px` : "50%",
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0.5, 0.7, 0.5],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

// 装饰星星
export const Stars: React.FC = () => {
  const stars = Array.from({ length: 15 }).map((_, i) => {
    const size = Math.random() * 6 + 2
    const top = `${Math.random() * 100}%`
    const left = `${Math.random() * 100}%`
    const delay = Math.random() * 5
    const duration = Math.random() * 3 + 2
    
    return (
      <motion.div
        key={i}
        className="absolute bg-white rounded-full"
        style={{
          width: size,
          height: size,
          top,
          left,
          boxShadow: `0 0 ${size}px ${size / 2}px rgba(255, 255, 255, 0.8)`,
        }}
        animate={{
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    )
  })
  
  return <div className="absolute inset-0 pointer-events-none">{stars}</div>
}

const Decorations: React.FC = () => {
  return (
    <>
      <FloatingBubbles />
      <PinkGlow />
      <Stars />
    </>
  )
}

export default Decorations 