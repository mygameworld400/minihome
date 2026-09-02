import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { MobileNav } from './Sidebar'
import DaySwitch from './DaySwitch'
import { useStore } from '../../hooks/useStore'

const FONT_OPTIONS = [
  {
    name: 'Yoontaeng',
    label: '윤탱체',
    value: "'Yoontaeng', sans-serif",
  },
  {
    name: 'Nanum Gothic Coding',
    label: '나눔고딕코딩',
    value: "'Nanum Gothic Coding', monospace",
  },
  {
    name: 'Chiron GoRound TC',
    label: 'Chiron GoRound TC',
    value: "'Chiron GoRound TC', sans-serif",
  },
]

export default function Layout() {
  const { loading, error, setError, workMode } = useStore()

  const [fontMenuOpen, setFontMenuOpen] = useState(false)

  const [selectedFont, setSelectedFont] = useState(() => {
    return localStorage.getItem('mini-home-font') || 'Yoontaeng'
  })

  useEffect(() => {
    const font = FONT_OPTIONS.find((item) => item.name === selectedFont)

    if (font) {
      document.documentElement.style.setProperty('--font', font.value)
      localStorage.setItem('mini-home-font', selectedFont)
    }
  }, [selectedFont])

  const changeFont = (fontName) => {
    setSelectedFont(fontName)
    setFontMenuOpen(false)
  }

  const currentFont =
    FONT_OPTIONS.find((font) => font.name === selectedFont) || FONT_OPTIONS[0]

  return (
    <>
      <div className="shell">
        <Sidebar />

        <main className={'main' + (workMode ? '' : ' work-off')}>
          {/* 우측 상단 빠른 설정 */}
          <div className="quick-settings">
            <DaySwitch />

            <button
              className="quick-settings-btn"
              onClick={() => setFontMenuOpen((prev) => !prev)}
              aria-label="설정"
              title="설정"
            >
              ⚙️
            </button>

            {fontMenuOpen && (
              <div className="font-menu">
                <div className="font-menu-title">
                  ✨ 폰트 설정
                </div>

                <div className="font-menu-current">
                  현재: {currentFont.label}
                </div>

                <div className="font-options">
                  {FONT_OPTIONS.map((font) => (
                    <button
                      key={font.name}
                      className={`font-option ${
                        selectedFont === font.name ? 'active' : ''
                      }`}
                      onClick={() => changeFont(font.name)}
                      style={{ fontFamily: font.value }}
                    >
                      <span className="font-option-check">
                        {selectedFont === font.name ? '✓' : ''}
                      </span>

                      <span>
                        {font.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div
              className="card"
              style={{
                borderColor: '#f3c2cc',
                background: '#ffe6ea',
                marginBottom: 12,
              }}
            >
              <div className="row">
                <span>⚠️ {error}</span>

                <button
                  className="btn btn-ghost btn-sm"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => setError(null)}
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="empty">불러오는 중… ☁️</div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <MobileNav />
    </>
  )
}
