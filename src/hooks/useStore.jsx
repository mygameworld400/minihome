import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './useAuth'
import * as T from '../services/taskService'
import * as P from '../services/personalService'
import * as M from '../services/memoService'
import * as C from '../services/calendarService'
import * as Pr from '../services/profileService'
import * as H from '../services/hobbyService'
import * as L from '../services/ledgerService'

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
  const [hobbies, setHobbies] = useState([])
  const [hobbyTasks, setHobbyTasks] = useState([])
  const [ledgerCategories, setLedgerCategories] = useState([])
  const [ledgerEntries, setLedgerEntries] = useState([])
  const [doneLog, setDoneLog] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user) return
    setError(null)
    try {
      /* 업무를 읽기 전에 먼저 날짜를 넘긴다.
         ON 인 업무는 하루가 지나면 다시 대기 상태가 된다. */
      await T.runDailyReset()

      const [pf, tr, pe, ta, ca, pt, ev, me, di, hb, ht, lc, le, dl] = await Promise.all([
        Pr.getProfile(user.id),
        T.listTracks(),
        T.listPeople(),
        T.listTasks(),
        P.listCategories(),
        P.listPersonalTasks(),
        C.listEvents(),
        M.listMemos(),
        M.listDiary(20),
        H.listHobbies(),
        H.listHobbyTasks(),
        L.listLedgerCategories(),
        L.listLedgerEntries(),
        T.listDoneLog(60),
      ])
      setProfile(pf); setTracks(tr); setPeople(pe); setTasks(ta)
      setCategories(ca); setPersonalTasks(pt); setEvents(ev)
      setMemos(me); setDiary(di)
      setHobbies(hb); setHobbyTasks(ht)
      setLedgerCategories(lc); setLedgerEntries(le)
      setDoneLog(dl)
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

  /* 체크할 때 완료 이력도 함께 남긴다.
     status 는 매일 초기화되므로 통계는 이 로그를 읽는다. */
  const toggleTask = useCallback(
    async (task) => {
      const nowDone = task.status !== 'done'
      const today = T.todayISO()

      if (nowDone) {
        setDoneLog((s) =>
          s.some((r) => r.task_id === task.id && r.done_date === today)
            ? s
            : [{ task_id: task.id, done_date: today, title: task.title, track_id: task.track_id }, ...s],
        )
      } else {
        setDoneLog((s) => s.filter((r) => !(r.task_id === task.id && r.done_date === today)))
      }

      await editTask(task.id, { status: nowDone ? 'done' : 'todo' })
      try {
        if (nowDone) await T.logDone(task)
        else await T.unlogDone(task.id)
      } catch (e) {
        setError(e.message ?? String(e))
      }
    },
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

  /* ── 취미보드 ───────────────────────────────────────────── */
  const addHobby = async (p) => {
    const r = await H.createHobby({ owner: user.id, ...p }); setHobbies((s) => [...s, r]); return r
  }
  const editHobby = async (id, p) => {
    const r = await H.updateHobby(id, p); setHobbies((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeHobby = async (id) => {
    await H.deleteHobby(id)
    setHobbies((s) => s.filter((x) => x.id !== id))
    setHobbyTasks((s) => s.filter((t) => t.hobby_id !== id))
  }

  const addHobbyTask = async (p) => {
    const r = await H.createHobbyTask({ owner: user.id, ...p })
    setHobbyTasks((s) => [...s, r]); return r
  }
  const editHobbyTask = async (id, p) => {
    const prev = hobbyTasks
    return optimistic(
      () => setHobbyTasks((s) => s.map((t) => (t.id === id ? { ...t, ...p } : t))),
      () => setHobbyTasks(prev),
      async () => {
        const r = await H.updateHobbyTask(id, p)
        setHobbyTasks((s) => s.map((t) => (t.id === id ? r : t)))
        return r
      },
    )
  }
  const removeHobbyTask = async (id) => {
    await H.deleteHobbyTask(id); setHobbyTasks((s) => s.filter((x) => x.id !== id))
  }

  /* ── 가계부 ─────────────────────────────────────────────── */
  const addLedgerCategory = async (p) => {
    const r = await L.createLedgerCategory({ owner: user.id, ...p })
    setLedgerCategories((s) => [...s, r]); return r
  }
  const editLedgerCategory = async (id, p) => {
    const r = await L.updateLedgerCategory(id, p)
    setLedgerCategories((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeLedgerCategory = async (id) => {
    await L.deleteLedgerCategory(id)
    setLedgerCategories((s) => s.filter((x) => x.id !== id))
    setLedgerEntries((s) => s.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)))
  }

  const addLedgerEntry = async (p) => {
    const r = await L.createLedgerEntry({ owner: user.id, ...p })
    setLedgerEntries((s) => [r, ...s]); return r
  }
  const editLedgerEntry = async (id, p) => {
    const r = await L.updateLedgerEntry(id, p)
    setLedgerEntries((s) => s.map((x) => (x.id === id ? r : x))); return r
  }
  const removeLedgerEntry = async (id) => {
    const prev = ledgerEntries
    return optimistic(
      () => setLedgerEntries((s) => s.filter((x) => x.id !== id)),
      () => setLedgerEntries(prev),
      () => L.deleteLedgerEntry(id),
    )
  }

  const value = {
    loading, error, setError, reload,
    profile, saveProfile,
    tracks, addTrack, editTrack, removeTrack,
    people, addPerson, editPerson, removePerson,
    tasks, byId, addTask, editTask, removeTask, toggleTask, moveTask,
    doneLog,
    categories, addCategory, editCategory, removeCategory,
    personalTasks, addPersonalTask, editPersonalTask, removePersonalTask,
    events, addEvent, editEvent, removeEvent,
    memos, addMemo, editMemo, removeMemo,
    diary, addDiary, removeDiary,
    hobbies, addHobby, editHobby, removeHobby,
    hobbyTasks, addHobbyTask, editHobbyTask, removeHobbyTask,
    ledgerCategories, addLedgerCategory, editLedgerCategory, removeLedgerCategory,
    ledgerEntries, addLedgerEntry, editLedgerEntry, removeLedgerEntry,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore must be used inside <StoreProvider>')
  return v
}
