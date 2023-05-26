import { ReactNode } from "react"

export interface Result {
  id: string,
  title: string
  type: string
  icon?: ReactNode
  action?: () => void
}

export interface ResultGroup {
  id: string,
  groupName: string,
  items: Array<Result>
}

export type ResultGroups = ResultGroup[]
