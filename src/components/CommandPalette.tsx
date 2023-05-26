import { useState, useEffect, useRef } from 'react'
import { Search, Clear, Star } from './icons'
import type { ResultGroups, Result } from '../types'
import { useQueries } from '@tanstack/react-query'

type ResultType = 'views' | 'triggers' | 'trigger_categories' | 'automations' | 'groups' | 'views' | 'macros'

const lazyNav = (items: Array<string>): Result[] => items.map(item => ({
  id: item,
  title: `${item[0].toUpperCase()}${item.slice(1)}`,
  type: 'nav',
  action: () => console.log(`/admin/${item}`)
}))

function ResultItem (props: Result) {
  const {
    title,
    type,
    icon,
    action = () => console.log('Hello')
  } = props

  return (
    <div className="grid grid-cols-1">
      <button className="group flex items-center focus:bg-green-600 hover:bg-green-600 hover:text-white focus:text-white px-3 py-2 outline-none gap-2" onClick={action}>
        {icon && <span>{icon}</span>}
        <span className="whitespace-nowrap truncate">{title}</span>
        <span className="flex-1" />
        <span className="text-slate-400 group-hover:text-white group-focus:text-white">{type}</span>
      </button>
    </div>
  )
}

function ResultGroup (props: { title: string, children: React.ReactNode }) {
  const { title, children } = props

  return (
    <div className="divide-y divide-slate-100">
      <div className="sticky top-0 bg-slate-100 uppercase text-xs font-semibold px-3 py-1.5">{title}</div>
      {children}
    </div>
  )
}

const fetchApi = (endpoint: string) => () => fetch(`/${endpoint}.json`).then(res => res.json())

const RESULT_TYPE_ORDER: ResultType[] = ['views', 'macros', 'triggers', 'trigger_categories', 'automations', 'groups']

export function CommandPalette () {
  const [commandValue, setCommandValue] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const commandRef = useRef<HTMLInputElement>(document.createElement('input'))
  const hasCommandValue = commandValue.length > 0

  const collections = useQueries({
    queries: RESULT_TYPE_ORDER.map(resultType => ({
      queryKey: [resultType], queryFn: fetchApi(resultType), staleTime: Infinity
    }))
  })

  const dynamicResults: Result[] = collections
    .flatMap((query, index) => {
      const type = RESULT_TYPE_ORDER[index]
      if (query.isSuccess) {
        return query.data[type].filter((item: any) => {
            const searchField = item.name || item.title || ''
            return searchField.toLowerCase().includes(commandValue.toLocaleLowerCase())
          }).map((item: any) => ({
            type,
            id: item.id,
            title: item.name || item.title || 'No Title?',
            action: () => console.log(type, item.id)
          }))
      } else {
        return []
      }
    })

  const resultGroups: ResultGroups = []

  const favorites = [
    {
      id: 'triggers',
      title: 'Triggers',
      type: 'favorite',
      icon: <Star size={16} title="Favie" />
    },
    {
      id: 'macros',
      title: 'Macros',
      type: 'favorite',
      icon: <Star size={16} title="Favie" />
    }
  ].filter(item => hasCommandValue ? item.title.toLowerCase().includes(commandValue.toLowerCase()) : true)

  // Favorites
  if (favorites.length) {
    resultGroups.push({
      id: 'favorites',
      groupName: 'Favorites',
      items: favorites
    })
  }

  if (hasCommandValue && dynamicResults.length) {
    resultGroups.push({
      id: 'dynamic',
      groupName: 'Results',
      items: dynamicResults
    })
  }

  // Basic navigation items...
  const navs = [
    'triggers',
    'macros',
    'users',
    'branding',
    'localization',
    'forms',
    'fields',
    'tags',
    'skills',
    'settings'
  ].filter(item => hasCommandValue ? item.includes(commandValue.toLowerCase()) : true)


  if (navs.length) {
    resultGroups.push({
      id: 'nav',
      groupName: 'Navigation',
      items: lazyNav(navs)
    })
  }

  useEffect(() => {
    function toggleVisibility (event: KeyboardEvent) {
      if (event.metaKey && event.key === 'k') {
        setIsVisible(visible => {
          const willBeVisible = !visible
          if (willBeVisible && commandRef.current) {
            commandRef.current.focus()
          }
          return willBeVisible
        })
      }

      if (event.key === 'Escape' && isVisible) {
        setIsVisible(false)
      }
    }

    document.addEventListener('keydown', toggleVisibility)

    return () => document.removeEventListener('keydown', toggleVisibility)
  }, [isVisible])

  return (
    <div className="h-screen grid place-items-center">
      <div className="absolute inset-0 bg-slate-700" onClick={() => isVisible && setIsVisible(false)} />
      <div className={`relative max-w-2xl w-full rounded-xl flex flex-col ${isVisible ? 'opacity-100 transition-opacity' : 'opacity-0'}`}>
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <form className="flex gap-3 p-3 bg-white">
            <label htmlFor="command">
              <Search size={24} title="Search" />
            </label>
            <input
              id="command"
              className="flex-1 text-xl outline-none"
              placeholder="Go To..."
              value={commandValue}
              autoComplete="off"
              ref={commandRef}
              onInput={event => {setCommandValue(event.currentTarget.value)}}
            />
            {hasCommandValue && (
              <button onClick={() => setCommandValue('')}>
                <Clear size={24} title="Clear Search" />
              </button>
            )}
          </form>
          <div className="overflow-y-scroll h-64">
            {resultGroups.length === 0 && hasCommandValue && (
              <p className="text-3xl text-center py-10">Hmmm.... can't find anything.</p>
            )}
            {resultGroups.length > 0 && resultGroups.map(({ groupName, id, items }) => (
              <ResultGroup title={groupName} key={id}>
                {items.map(item => (
                  <ResultItem key={item.id} {...item} />
                ))}
              </ResultGroup>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
