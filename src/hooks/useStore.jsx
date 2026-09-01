import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import * as T from '../services/taskService'
import * as P from '../services/personalService'
import * as M from '../services/memoService'
import * as C from '../services/calendarService'
import * as Pr from '../services/profileService'

/* ===========================================================
   앱 전체 데이터 저장소.
   로그인되면 한 번에 다 불러오고, 변경은 낙관적으로 화면에 먼저
   반영한 뒤 DB 에 쓴다. 실패하면 다시 불러와 되돌린다.
   =========================================================== */

const Ctx = createContext(null)

export function StoreProvider({ children }) {
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [tracks, setTracks] = useState([])
  const [people, setPeople] = useState([])
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [personalTasks, setPersonalTasks] = useState([])
  const [events, setEvents] = useState([])
  const [memos, setMemos] = useState([])
  const [diary, setDiary] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      const [pf, tr, pe, ta, ca, pt, ev, me, di] = await Promise.all([
        Pr.getProfile(user.id),
        T.listTracks(),
        T.listPeople(),
        T.listTasks(),
        P.listCategories(),
        P.listPersonalTasks(),
        C.listEvents(),
        M.listMemos(),
        M.listDiary(20),
      ])
      setProfile(pf); setTracks(tr); setPeople(pe); setTasks(ta)
      setCategories(ca); setPersonalTasks(pt); setEvents(ev)
      setMemos(me); setDiary(di)
    } catch (e) {
      setError(e.message ?? String(e))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    reload()
  }, [user, reload])

  /* 낙관적 갱신 헬퍼 — 화면 먼저, DB 나중, 실패하면 되돌린다. */
  const optimistic = useCallback(
    async (apply, revert, run) => {
      apply()
      try {
        return await run()
      } catch (e) {
        setError(e.message ?? String(e))
        revert()
        throw e
      }
    },
    [],
  )

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks])

  /* ── 업무 ───────────────────────────────────────────────── */
  const addTask = useCallback(
    async (patch) => {
      const row = await T.createTask({ owner: user.id, ...patch })
      setTasks((s) => [...s, row])
      return row
    },
    [user],
  )

  const editTask = useCallback(
    async (id, patch) => {
      const prev = tasks
      return optimistic(
        () => setTasks((s) => s.map((t) => (t.id === id ? { ...t, ...patch } : t))),
        () => setTasks(prev),
        async () => {
          const row = await T.updateTask(id, patch)
          setTasks((s) => s.map((t) => (t.id === id ? row : t)))
          return row
        },
      )
    },
    [tasks, optimistic],
  )

  const removeTask = useCallback(
    async (id) => {
      const prev = tasks
      return optimistic(
        () => setTasks((s) => s.filter((t) => t.id !== id)),
        () => setTasks(prev),
        () => T.deleteTask(id),
      )
    },
    [tasks, optimistic],
  )

  const toggleTask = useCallback(
    (task) => editTask(task.id, { status: task.status === 'done' ? 'todo' : 'done' }),
    [editTask],
  )

  const moveTask = useCallback(
    async (ordered) => {
      const prev = tasks
      const rows = ordered.map((t, i) => ({ id: t.id, sort_order: i + 1 }))
      return optimistic(
        () => {
          const m = new Map(rows.map((r) => [r.id, r.sort_order]))
          setTasks((s) => s.map((t) => (m.has(t.id) ? { ...t, sort_order: m.get(t.id) } : t)))
        },
        () => setTasks(prev),
        () => T.reorderTasks(rows),
      )
    },
    [tasks, optimistic],
  )

  /* ── 트랙 / 담당자 ──────────────────────────────────────── */
  const addTrack = async (p) => {
    const r = await T.createTrack({ owner: user.id, ...p }); setTracks((s) => [...s, r]); return r
  }
  const editTrack = async (id, p) => {
    const r = await T.updateTrack(id, p); setTracks((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeTrack = async (id) => {
    await T.deleteTrack(id)
    setTracks((s) => s.filter((x) => x.id !== id))
    setTasks((s) => s.map((t) => (t.track_id === id ? { ...t, track_id: null } : t)))
  }

  const addPerson = async (p) => {
    const r = await T.createPerson({ owner: user.id, ...p }); setPeople((s) => [...s, r]); return r
  }
  const editPerson = async (id, p) => {
    const r = await T.updatePerson(id, p); setPeople((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removePerson = async (id) => {
    await T.deletePerson(id)
    setPeople((s) => s.filter((x) => x.id !== id))
    setTasks((s) => s.map((t) => (t.assignee_id === id ? { ...t, assignee_id: null } : t)))
  }

  /* ── 개인보드 ───────────────────────────────────────────── */
  const addCategory = async (p) => {
    const r = await P.createCategory({ owner: user.id, ...p }); setCategories((s) => [...s, r]); return r
  }
  const editCategory = async (id, p) => {
    const r = await P.updateCategory(id, p); setCategories((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeCategory = async (id) => {
    await P.deleteCategory(id)
    setCategories((s) => s.filter((x) => x.id !== id))
    setPersonalTasks((s) => s.filter((t) => t.category_id !== id))
  }

  const addPersonalTask = async (p) => {
    const r = await P.createPersonalTask({ owner: user.id, ...p })
    setPersonalTasks((s) => [...s, r]); return r
  }
  const editPersonalTask = async (id, p) => {
    const r = await P.updatePersonalTask(id, p)
    setPersonalTasks((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removePersonalTask = async (id) => {
    await P.deletePersonalTask(id)
    setPersonalTasks((s) => s.filter((x) => x.id !== id))
  }

  /* ── 캘린더 / 메모 / 다이어리 ───────────────────────────── */
  const addEvent = async (p) => {
    const r = await C.createEvent({ owner: user.id, ...p }); setEvents((s) => [...s, r]); return r
  }
  const editEvent = async (id, p) => {
    const r = await C.updateEvent(id, p); setEvents((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeEvent = async (id) => {
    await C.deleteEvent(id); setEvents((s) => s.filter((x) => x.id !== id))
  }

  const addMemo = async (p) => {
    const r = await M.createMemo({ owner: user.id, ...p }); setMemos((s) => [r, ...s]); return r
  }
  const editMemo = async (id, p) => {
    const r = await M.updateMemo(id, p); setMemos((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeMemo = async (id) => {
    await M.deleteMemo(id); setMemos((s) => s.filter((x) => x.id !== id))
  }

  const addDiary = async (p) => {
    const r = await M.createDiary({ owner: user.id, ...p }); setDiary((s) => [r, ...s]); return r
  }
  const removeDiary = async (id) => {
    await M.deleteDiary(id); setDiary((s) => s.filter((x) => x.id !== id))
  }

  const saveProfile = async (patch) => {
    const r = await Pr.updateProfile(user.id, patch); setProfile(r); return r
  }

  const value = {
    loading, error, setError, reload,
    profile, saveProfile,
    tracks, addTrack, editTrack, removeTrack,
    people, addPerson, editPerson, removePerson,
    tasks, byId, addTask, editTask, removeTask, toggleTask, moveTask,
    categories, addCategory, editCategory, removeCategory,
    personalTasks, addPersonalTask, editPersonalTask, removePersonalTask,
    events, addEvent, editEvent, removeEvent,
    memos, addMemo, editMemo, removeMemo,
    diary, addDiary, removeDiary,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}
