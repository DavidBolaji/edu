// components/TopProgressBar.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function Progress() {
  const pathname = usePathname()

  // top progress bar states
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)

  // overlay state (three-dot centered loader)
  const [overlayVisible, setOverlayVisible] = useState(false)

  // expose global functions to control the bar and overlay
  useEffect(() => {
    ;(window as any).__showTopProgress = () => {
      setVisible(true)
      setWidth(6)
    }
    ;(window as any).__hideTopProgress = () => {
      setWidth(100)
      setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 300)
    }

    ;(window as any).__showOverlayLoading = (opts?: { blockPointerEvents?: boolean }) => {
      setOverlayVisible(true)
    }
    ;(window as any).__hideOverlayLoading = () => {
      setOverlayVisible(false)
    }

    return () => {
      delete (window as any).__showTopProgress
      delete (window as any).__hideTopProgress
      delete (window as any).__showOverlayLoading
      delete (window as any).__hideOverlayLoading
    }
  }, [])

  // auto-hide progress bar and overlay on route change
  useEffect(() => {
    if (visible) (window as any).__hideTopProgress?.()
    if (overlayVisible) setOverlayVisible(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // simple progress incrementing
  useEffect(() => {
    if (!visible) return
    const id = window.setInterval(() => {
      setWidth((w) => {
        const delta = w < 30 ? 8 : w < 60 ? 4 : 1.5
        return Math.min(90, w + delta)
      })
    }, 250)
    return () => window.clearInterval(id)
  }, [visible])

  return (
    <>
      {/* --- Top progress bar --- */}
      {visible && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            pointerEvents: 'none',
            height: 3,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${width}%`,
              transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
              boxShadow: '0 0 20px rgba(102, 126, 234, 0.6), 0 0 40px rgba(118, 75, 162, 0.4)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Shimmer effect */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'tp-shimmer 1.5s infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* --- Sleek corner spinner --- */}
      {visible && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 10000,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'rgba(15, 15, 35, 0.85)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 24px rgba(102, 126, 234, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            pointerEvents: 'none',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 50 50"
            style={{ display: 'block', animation: 'tp-spin 1s linear infinite' }}
          >
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="url(#spinner-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="90"
              strokeDashoffset="20"
            />
            <defs>
              <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#f093fb" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}

      {/* --- Fullscreen overlay with centered animated dots --- */}
      {overlayVisible && (
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 15000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'auto',
            animation: 'tp-fadeIn 0.2s ease-out',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 32,
              borderRadius: 20,
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {/* Three animated dots - properly centered */}
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'center',
                height: 32,
              }}
            >
              <span className="tp-dot tp-dot-1" />
              <span className="tp-dot tp-dot-2" />
              <span className="tp-dot tp-dot-3" />
            </div>
          </div>
        </div>
      )}

      {/* --- Inline CSS for animations --- */}
      <style jsx global>{`
        @keyframes tp-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes tp-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes tp-fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes tp-scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .tp-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          boxShadow: 0 0 20px rgba(102, 126, 234, 0.6), 0 4px 12px rgba(118, 75, 162, 0.4);
          position: relative;
        }

        .tp-dot::after {
          content: '';
          position: absolute;
          inset: 2px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent);
        }

        .tp-dot-1 {
          animation: tp-bounce-wave 1.2s ease-in-out infinite;
          animation-delay: 0s;
        }
        .tp-dot-2 {
          animation: tp-bounce-wave 1.2s ease-in-out infinite;
          animation-delay: 0.15s;
        }
        .tp-dot-3 {
          animation: tp-bounce-wave 1.2s ease-in-out infinite;
          animation-delay: 0.3s;
        }

        @keyframes tp-bounce-wave {
          0%, 60%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-16px) scale(1.1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}