import { Store } from '@tanstack/store'
import invariant from 'tiny-invariant'

//

import {
  LinkInfo,
  LinkOptions,
  NavigateOptions,
  ToOptions,
  ResolveRelativePath,
} from './link'
import {
  cleanPath,
  interpolatePath,
  joinPaths,
  matchPathname,
  parsePathname,
  resolvePath,
  trimPath,
  trimPathRight,
} from './path'
import {
  Route,
  AnySearchSchema,
  AnyRoute,
  AnyContext,
  AnyPathParams,
  RegisteredRouteComponent,
  RegisteredErrorRouteComponent,
  RegisteredPendingRouteComponent,
  RouteMask,
} from './route'
import {
  RoutesById,
  RoutesByPath,
  ParseRoute,
  FullSearchSchema,
  RouteById,
  RoutePaths,
  RouteIds,
} from './routeInfo'
import { defaultParseSearch, defaultStringifySearch } from './searchParams'
import {
  functionalUpdate,
  last,
  NoInfer,
  pick,
  PickAsRequired,
  Timeout,
  Updater,
  replaceEqualDeep,
  partialDeepEqual,
  NonNullableUpdater,
} from './utils'
import {
  createBrowserHistory,
  createMemoryHistory,
  HistoryLocation,
  HistoryState,
  RouterHistory,
} from './history'

//

declare global {
  interface Window {
    __TSR_DEHYDRATED__?: HydrationCtx
  }
}

export interface Register {
  // router: Router
}

export interface LocationState {}

export type AnyRouter = Router<any, any>

export type RegisteredRouter = Register extends {
  router: infer TRouter extends AnyRouter
}
  ? TRouter
  : AnyRouter

export interface ParsedLocation<TSearchObj extends AnySearchSchema = {}> {
  href: string
  pathname: string
  search: TSearchObj
  searchStr: string
  state: HistoryState
  hash: string
  maskedLocation?: ParsedLocation<TSearchObj>
  unmaskOnReload?: boolean
}

export interface FromLocation {
  pathname: string
  search?: unknown
  hash?: string
}

export type SearchSerializer = (searchObj: Record<string, any>) => string
export type SearchParser = (searchStr: string) => Record<string, any>

export type HydrationCtx = {
  router: DehydratedRouter
  payload: Record<string, any>
}

export interface RouteMatch<
  TRouteTree extends AnyRoute = AnyRoute,
  TRouteId extends RouteIds<TRouteTree> = ParseRoute<TRouteTree>['id'],
> {
  id: string
  // loaderContext?: RouteById<TRouteTree, TRouteId>['types']['loaderContext']
  loaderContext?: any
  routeId: TRouteId
  pathname: string
  params: RouteById<TRouteTree, TRouteId>['types']['allParams']
  status: 'pending' | 'success' | 'error'
  isFetching: boolean
  invalid: boolean
  error: unknown
  paramsError: unknown
  searchError: unknown
  updatedAt: number
  maxAge: number
  preloadMaxAge: number
  loaderData: RouteById<TRouteTree, TRouteId>['types']['loader']
  loadPromise?: Promise<void>
  __resolveLoadPromise?: () => void
  context: RouteById<TRouteTree, TRouteId>['types']['context']
  routeSearch: RouteById<TRouteTree, TRouteId>['types']['searchSchema']
  search: FullSearchSchema<TRouteTree> &
    RouteById<TRouteTree, TRouteId>['types']['fullSearchSchema']
  fetchedAt: number
  abortController: AbortController
}

export type AnyRouteMatch = RouteMatch<any>

export type RouterContextOptions<TRouteTree extends AnyRoute> =
  AnyContext extends TRouteTree['types']['routerContext']
    ? {
        context?: TRouteTree['types']['routerContext']
      }
    : {
        context: TRouteTree['types']['routerContext']
      }

export interface RouterOptions<
  TRouteTree extends AnyRoute,
  TDehydrated extends Record<string, any>,
> {
  history?: RouterHistory
  stringifySearch?: SearchSerializer
  parseSearch?: SearchParser
  defaultPreload?: false | 'intent'
  defaultPreloadDelay?: number
  reloadOnWindowFocus?: boolean
  defaultComponent?: RegisteredRouteComponent<
    unknown,
    AnySearchSchema,
    AnyPathParams,
    AnyContext,
    AnyContext
  >
  defaultErrorComponent?: RegisteredErrorRouteComponent<
    AnySearchSchema,
    AnyPathParams,
    AnyContext,
    AnyContext
  >
  defaultPendingComponent?: RegisteredPendingRouteComponent<
    AnySearchSchema,
    AnyPathParams,
    AnyContext,
    AnyContext
  >
  defaultMaxAge?: number
  defaultGcMaxAge?: number
  defaultPreloadMaxAge?: number
  caseSensitive?: boolean
  routeTree?: TRouteTree
  basepath?: string
  createRoute?: (opts: { route: AnyRoute; router: AnyRouter }) => void
  context?: TRouteTree['types']['routerContext']
  dehydrate?: () => TDehydrated
  hydrate?: (dehydrated: TDehydrated) => void
  routeMasks?: RouteMask<TRouteTree>[]
  unmaskOnReload?: boolean
}

export interface RouterState<TRouteTree extends AnyRoute = AnyRoute> {
  status: 'idle' | 'pending'
  isFetching: boolean
  matchesById: Record<string, RouteMatch<TRouteTree>>
  matchIds: string[]
  pendingMatchIds: string[]
  matches: RouteMatch<TRouteTree>[]
  pendingMatches: RouteMatch<TRouteTree>[]
  renderedMatchIds: string[]
  renderedMatches: RouteMatch<TRouteTree>[]
  location: ParsedLocation<FullSearchSchema<TRouteTree>>
  resolvedLocation: ParsedLocation<FullSearchSchema<TRouteTree>>
  lastUpdated: number
}

export type ListenerFn<TEvent extends RouterEvent> = (event: TEvent) => void

export interface BuildNextOptions {
  to?: string | number | null
  params?: true | Updater<unknown>
  search?: true | Updater<unknown>
  hash?: true | Updater<string>
  state?: true | NonNullableUpdater<LocationState>
  mask?: {
    to?: string | number | null
    params?: true | Updater<unknown>
    search?: true | Updater<unknown>
    hash?: true | Updater<string>
    state?: true | NonNullableUpdater<LocationState>
    unmaskOnReload?: boolean
  }
  from?: string
}

export interface CommitLocationOptions {
  replace?: boolean
  resetScroll?: boolean
}

export interface MatchLocation {
  to?: string | number | null
  fuzzy?: boolean
  caseSensitive?: boolean
  from?: string
}

export interface MatchRouteOptions {
  pending?: boolean
  caseSensitive?: boolean
  includeSearch?: boolean
  fuzzy?: boolean
}

type LinkCurrentTargetElement = {
  preloadTimeout?: null | ReturnType<typeof setTimeout>
}

export interface DehydratedRouterState {
  matchIds: string[]
  dehydratedMatches: DehydratedRouteMatch[]
}

export type DehydratedRouteMatch = Pick<
  RouteMatch,
  | 'fetchedAt'
  | 'invalid'
  | 'maxAge'
  | 'preloadMaxAge'
  | 'id'
  | 'loaderData'
  | 'status'
  | 'updatedAt'
>

export interface DehydratedRouter {
  state: DehydratedRouterState
}

export type RouterConstructorOptions<
  TRouteTree extends AnyRoute,
  TDehydrated extends Record<string, any>,
> = Omit<RouterOptions<TRouteTree, TDehydrated>, 'context'> &
  RouterContextOptions<TRouteTree>

export const componentTypes = [
  'component',
  'errorComponent',
  'pendingComponent',
] as const

export type RouterEvents = {
  onBeforeLoad: {
    type: 'onBeforeLoad'
    from: ParsedLocation
    to: ParsedLocation
    pathChanged: boolean
  }
  onLoad: {
    type: 'onLoad'
    from: ParsedLocation
    to: ParsedLocation
    pathChanged: boolean
  }
}

export type RouterEvent = RouterEvents[keyof RouterEvents]

export type RouterListener<TRouterEvent extends RouterEvent> = {
  eventType: TRouterEvent['type']
  fn: ListenerFn<TRouterEvent>
}

const visibilityChangeEvent = 'visibilitychange'
const focusEvent = 'focus'
const preloadWarning = 'Error preloading route! ☝️'

export class Router<
  TRouteTree extends AnyRoute = AnyRoute,
  TDehydrated extends Record<string, any> = Record<string, any>,
> {
  types!: {
    RootRoute: TRouteTree
  }

  options: PickAsRequired<
    RouterOptions<TRouteTree, TDehydrated>,
    'stringifySearch' | 'parseSearch' | 'context'
  >
  history!: RouterHistory
  #unsubHistory?: () => void
  basepath!: string
  routeTree!: TRouteTree
  routesById!: RoutesById<TRouteTree>
  routesByPath!: RoutesByPath<TRouteTree>
  flatRoutes!: ParseRoute<TRouteTree>[]
  navigateTimeout: undefined | Timeout
  nextAction: undefined | 'push' | 'replace'
  navigationPromise: undefined | Promise<void>

  __store: Store<RouterState<TRouteTree>>
  state: RouterState<TRouteTree>
  dehydratedData?: TDehydrated
  resetNextScroll = false
  tempLocationKey = `${Math.round(Math.random() * 10000000)}`
  // nextTemporaryLocation?: ParsedLocation<FullSearchSchema<TRouteTree>>

  constructor(options: RouterConstructorOptions<TRouteTree, TDehydrated>) {
    this.options = {
      defaultPreloadDelay: 50,
      context: undefined!,
      ...options,
      stringifySearch: options?.stringifySearch ?? defaultStringifySearch,
      parseSearch: options?.parseSearch ?? defaultParseSearch,
      // fetchServerDataFn: options?.fetchServerDataFn ?? defaultFetchServerDataFn,
    }

    this.__store = new Store<RouterState<TRouteTree>>(getInitialRouterState(), {
      onUpdate: () => {
        const prev = this.state

        const next = this.__store.state

        const matchesByIdChanged = prev.matchesById !== next.matchesById
        let matchesChanged
        let pendingMatchesChanged

        if (!matchesByIdChanged) {
          matchesChanged =
            prev.matchIds.length !== next.matchIds.length ||
            prev.matchIds.some((d, i) => d !== next.matchIds[i])

          pendingMatchesChanged =
            prev.pendingMatchIds.length !== next.pendingMatchIds.length ||
            prev.pendingMatchIds.some((d, i) => d !== next.pendingMatchIds[i])
        }

        if (matchesByIdChanged || matchesChanged) {
          next.matches = next.matchIds.map((id) => {
            return next.matchesById[id] as any
          })
        }

        if (matchesByIdChanged || pendingMatchesChanged) {
          next.pendingMatches = next.pendingMatchIds.map((id) => {
            return next.matchesById[id] as any
          })
        }

        if (matchesByIdChanged || matchesChanged || pendingMatchesChanged) {
          const hasPendingComponent = next.pendingMatches.some((d) => {
            const route = this.getRoute(d.routeId as any)
            return !!route?.options.pendingComponent
          })

          next.renderedMatchIds = hasPendingComponent
            ? next.pendingMatchIds
            : next.matchIds

          next.renderedMatches = next.renderedMatchIds.map((id) => {
            return next.matchesById[id] as any
          })
        }

        next.isFetching = [...next.matches, ...next.pendingMatches].some(
          (d) => d.isFetching,
        )

        this.state = next
      },
      defaultPriority: 'low',
    })

    this.state = this.__store.state

    this.update(options)

    const nextLocation = this.buildLocation({
      search: true,
      params: true,
      hash: true,
      state: true,
    })

    if (this.state.location.href !== nextLocation.href) {
      this.#commitLocation({ ...nextLocation, replace: true })
    }
  }

  subscribers = new Set<RouterListener<RouterEvent>>()

  subscribe = <TType extends keyof RouterEvents>(
    eventType: TType,
    fn: ListenerFn<RouterEvents[TType]>,
  ) => {
    const listener: RouterListener<any> = {
      eventType,
      fn,
    }

    this.subscribers.add(listener)

    return () => {
      this.subscribers.delete(listener)
    }
  }

  #emit = (routerEvent: RouterEvent) => {
    this.subscribers.forEach((listener) => {
      if (listener.eventType === routerEvent.type) {
        listener.fn(routerEvent)
      }
    })
  }

  reset = () => {
    this.__store.setState((s) => Object.assign(s, getInitialRouterState()))
  }

  mount = () => {
    // addEventListener does not exist in React Native, but window does
    // In the future, we might need to invert control here for more adapters
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener(visibilityChangeEvent, this.#onFocus, false)
      window.addEventListener(focusEvent, this.#onFocus, false)
    }

    this.safeLoad()

    return () => {
      if (typeof window !== 'undefined' && window.removeEventListener) {
        window.removeEventListener(visibilityChangeEvent, this.#onFocus)
        window.removeEventListener(focusEvent, this.#onFocus)
      }
    }
  }

  #onFocus = () => {
    if (this.options.reloadOnWindowFocus ?? true) {
      this.invalidate({
        __fromFocus: true,
      })
    }
  }

  update = (opts?: RouterOptions<any, any>): this => {
    this.options = {
      ...this.options,
      ...opts,
      context: {
        ...this.options.context,
        ...opts?.context,
      },
    }

    if (
      !this.history ||
      (this.options.history && this.options.history !== this.history)
    ) {
      if (this.#unsubHistory) {
        this.#unsubHistory()
      }

      this.history =
        this.options.history ??
        (isServer ? createMemoryHistory() : createBrowserHistory()!)

      const parsedLocation = this.#parseLocation()

      this.__store.setState((s) => ({
        ...s,
        resolvedLocation: parsedLocation as any,
        location: parsedLocation as any,
      }))

      this.#unsubHistory = this.history.subscribe(() => {
        this.safeLoad({
          next: this.#parseLocation(this.state.location),
        })
      })
    }

    const { basepath, routeTree } = this.options

    this.basepath = `/${trimPath(basepath ?? '') ?? ''}`

    if (routeTree && routeTree !== this.routeTree) {
      this.#processRoutes(routeTree)
    }

    return this
  }

  cancelMatches = () => {
    this.state.matches.forEach((match) => {
      this.cancelMatch(match.id)
    })
  }

  cancelMatch = (id: string) => {
    this.getRouteMatch(id)?.abortController?.abort()
  }

  safeLoad = async (opts?: { next?: ParsedLocation }) => {
    try {
      return this.load(opts)
    } catch (err) {
      // Don't do anything
    }
  }

  latestLoadPromise: Promise<void> = Promise.resolve()

  load = async (opts?: {
    next?: ParsedLocation
    throwOnError?: boolean
    __dehydratedMatches?: DehydratedRouteMatch[]
  }) => {
    const promise = new Promise<void>(async (resolve, reject) => {
      const prevLocation = this.state.resolvedLocation
      const pathDidChange = !!(
        opts?.next && prevLocation!.href !== opts.next.href
      )

      let latestPromise: Promise<void> | undefined | null

      const checkLatest = (): undefined | Promise<void> | null => {
        return this.latestLoadPromise !== promise
          ? this.latestLoadPromise
          : undefined
      }

      // Cancel any pending matches

      let pendingMatches!: RouteMatch<any, any>[]

      this.#emit({
        type: 'onBeforeLoad',
        from: prevLocation,
        to: opts?.next ?? this.state.location,
        pathChanged: pathDidChange,
      })

      this.__store.batch(() => {
        if (opts?.next) {
          // Ingest the new location
          this.__store.setState((s) => ({
            ...s,
            location: opts.next! as any,
          }))
        }

        // Match the routes
        pendingMatches = this.matchRoutes(
          this.state.location.pathname,
          this.state.location.search,
          {
            throwOnError: opts?.throwOnError,
            debug: true,
          },
        )

        this.__store.setState((s) => ({
          ...s,
          status: 'pending',
          pendingMatchIds: pendingMatches.map((d) => d.id),
          matchesById: this.#mergeMatches(s.matchesById, pendingMatches),
        }))
      })

      try {
        // Load the matches
        try {
          await this.loadMatches(pendingMatches.map((d) => d.id))
        } catch (err) {
          // swallow this error, since we'll display the
          // errors on the route components
        }

        // Only apply the latest transition
        if ((latestPromise = checkLatest())) {
          return latestPromise
        }

        const exitingMatchIds = this.state.matchIds.filter(
          (id) => !this.state.pendingMatchIds.includes(id),
        )

        const enteringMatchIds = this.state.pendingMatchIds.filter(
          (id) => !this.state.matchIds.includes(id),
        )

        const stayingMatchIds = this.state.matchIds.filter((id) =>
          this.state.pendingMatchIds.includes(id),
        )

        this.__store.setState((s) => ({
          ...s,
          status: 'idle',
          resolvedLocation: s.location,
          matchIds: s.pendingMatchIds,
          pendingMatchIds: [],
        }))
        ;(
          [
            [exitingMatchIds, 'onLeave'],
            [enteringMatchIds, 'onEnter'],
            [stayingMatchIds, 'onTransition'],
          ] as const
        ).forEach(([matchIds, hook]) => {
          matchIds.forEach((id) => {
            const match = this.getRouteMatch(id)!
            const route = this.getRoute(match.routeId)
            route.options[hook]?.(match)
          })
        })

        this.#emit({
          type: 'onLoad',
          from: prevLocation,
          to: this.state.location,
          pathChanged: pathDidChange,
        })

        resolve()
      } catch (err) {
        // Only apply the latest transition
        if ((latestPromise = checkLatest())) {
          return latestPromise
        }

        reject(err)
      }
    })

    this.latestLoadPromise = promise

    this.latestLoadPromise.then(() => {
      this.cleanMatches()
    })

    return this.latestLoadPromise
  }

  #mergeMatches = (
    prevMatchesById: Record<string, RouteMatch<TRouteTree>>,
    nextMatches: AnyRouteMatch[],
  ): Record<string, RouteMatch<TRouteTree>> => {
    let matchesById = { ...prevMatchesById }

    nextMatches.forEach((match) => {
      if (!matchesById[match.id]) {
        matchesById[match.id] = match
      }

      matchesById[match.id] = {
        ...matchesById[match.id],
        ...match,
      }
    })

    return matchesById
  }

  getRoute = (id: string): Route => {
    const route = (this.routesById as any)[id]

    invariant(route, `Route with id "${id as string}" not found`)

    return route as any
  }

  preloadRoute = async (
    navigateOpts: BuildNextOptions & {
      maxAge?: number
    } = this.state.location,
  ) => {
    let next = this.buildLocation(navigateOpts)

    const matches = this.matchRoutes(next.pathname, next.search, {
      throwOnError: true,
    })

    this.__store.setState((s) => {
      return {
        ...s,
        matchesById: this.#mergeMatches(s.matchesById, matches),
      }
    })

    await this.loadMatches(
      matches.map((d) => d.id),
      {
        preload: true,
        maxAge: navigateOpts.maxAge,
      },
    )

    return [last(matches)!, matches] as const
  }

  cleanMatches = () => {
    const now = Date.now()

    const outdatedMatchIds = Object.values(this.state.matchesById)
      .filter((match) => {
        const route = this.getRoute(match.routeId)

        return (
          !this.state.matchIds.includes(match.id) &&
          !this.state.pendingMatchIds.includes(match.id) &&
          (match.preloadMaxAge > -1
            ? match.updatedAt + match.preloadMaxAge < now
            : true) &&
          (route.options.gcMaxAge
            ? match.updatedAt + route.options.gcMaxAge < now
            : true)
        )
      })
      .map((d) => d.id)

    if (outdatedMatchIds.length) {
      this.__store.setState((s) => {
        const matchesById = { ...s.matchesById }
        outdatedMatchIds.forEach((id) => {
          delete matchesById[id]
        })
        return {
          ...s,
          matchesById,
        }
      })
    }
  }

  matchRoutes = (
    pathname: string,
    locationSearch: AnySearchSchema,
    opts?: { throwOnError?: boolean; debug?: boolean },
  ): RouteMatch<TRouteTree>[] => {
    let routeParams: AnyPathParams = {}

    let foundRoute = this.flatRoutes.find((route) => {
      const matchedParams = matchPathname(
        this.basepath,
        trimPathRight(pathname),
        {
          to: route.fullPath,
          caseSensitive:
            route.options.caseSensitive ?? this.options.caseSensitive,
        },
      )

      if (matchedParams) {
        routeParams = matchedParams
        return true
      }

      return false
    })

    let routeCursor: AnyRoute =
      foundRoute || (this.routesById as any)['__root__']

    let matchedRoutes: AnyRoute[] = [routeCursor]
    // let includingLayouts = true
    while (routeCursor?.parentRoute) {
      routeCursor = routeCursor.parentRoute
      if (routeCursor) matchedRoutes.unshift(routeCursor)
    }

    // Existing matches are matches that are already loaded along with
    // pending matches that are still loading

    const parseErrors = matchedRoutes.map((route) => {
      let parsedParamsError

      if (route.options.parseParams) {
        try {
          const parsedParams = route.options.parseParams(routeParams)
          // Add the parsed params to the accumulated params bag
          Object.assign(routeParams, parsedParams)
        } catch (err: any) {
          parsedParamsError = new PathParamError(err.message, {
            cause: err,
          })

          if (opts?.throwOnError) {
            throw parsedParamsError
          }

          return parsedParamsError
        }
      }

      return
    })

    const matches = matchedRoutes.map((route, index) => {
      const interpolatedPath = interpolatePath(route.path, routeParams)
      const loaderContext = route.options.loaderContext
        ? route.options.loaderContext({
            search: locationSearch,
          })
        : undefined

      const matchId = JSON.stringify(
        [interpolatePath(route.id, routeParams, true), loaderContext].filter(
          (d) => d !== undefined,
        ),
        (key, value) => {
          if (typeof value === 'function') {
            console.info(route)
            invariant(
              false,
              `Cannot return functions and other non-serializable values from routeOptions.loaderContext! Please use routeOptions.beforeLoad to do this. Route info is logged above 👆`,
            )
          }
          if (typeof value === 'object' && value !== null) {
            return Object.fromEntries(
              Object.keys(value)
                .sort()
                .map((key) => [key, value[key]]),
            )
          }
          return value
        },
      )

      // Waste not, want not. If we already have a match for this route,
      // reuse it. This is important for layout routes, which might stick
      // around between navigation actions that only change leaf routes.
      const existingMatch = this.getRouteMatch(matchId)

      if (existingMatch) {
        return { ...existingMatch }
      }

      // Create a fresh route match
      const hasLoaders = !!(
        route.options.loader ||
        componentTypes.some((d) => (route.options[d] as any)?.preload)
      )

      const routeMatch: AnyRouteMatch = {
        id: matchId,
        loaderContext,
        routeId: route.id,
        params: routeParams,
        pathname: joinPaths([this.basepath, interpolatedPath]),
        updatedAt: Date.now(),
        maxAge: -1,
        preloadMaxAge: -1,
        routeSearch: {},
        search: {} as any,
        status: hasLoaders ? 'pending' : 'success',
        isFetching: false,
        invalid: false,
        error: undefined,
        paramsError: parseErrors[index],
        searchError: undefined,
        loaderData: undefined,
        loadPromise: Promise.resolve(),
        context: undefined!,
        abortController: new AbortController(),
        fetchedAt: 0,
      }

      return routeMatch
    })

    // Take each match and resolve its search params and context
    // This has to happen after the matches are created or found
    // so that we can use the parent match's search params and context
    matches.forEach((match, i): any => {
      const parentMatch = matches[i - 1]
      const route = this.getRoute(match.routeId)

      const searchInfo = (() => {
        // Validate the search params and stabilize them
        const parentSearchInfo = {
          search: parentMatch?.search ?? locationSearch,
          routeSearch: parentMatch?.routeSearch ?? locationSearch,
        }

        try {
          const validator =
            typeof route.options.validateSearch === 'object'
              ? route.options.validateSearch.parse
              : route.options.validateSearch

          let routeSearch = validator?.(parentSearchInfo.search) ?? {}

          let search = {
            ...parentSearchInfo.search,
            ...routeSearch,
          }

          routeSearch = replaceEqualDeep(match.routeSearch, routeSearch)
          search = replaceEqualDeep(match.search, search)

          return {
            routeSearch,
            search,
            searchDidChange: match.routeSearch !== routeSearch,
          }
        } catch (err: any) {
          match.searchError = new SearchParamError(err.message, {
            cause: err,
          })

          if (opts?.throwOnError) {
            throw match.searchError
          }

          return parentSearchInfo
        }
      })()

      Object.assign(match, searchInfo)
    })

    return matches as any
  }

  loadMatches = async (
    matchIds: string[],
    opts?: {
      preload?: boolean
      maxAge?: number
    },
  ) => {
    const getFreshMatches = () => matchIds.map((d) => this.getRouteMatch(d)!)

    if (!opts?.preload) {
      getFreshMatches().forEach((match) => {
        // Update each match with its latest route data
        this.setRouteMatch(match.id, (s) => ({
          ...s,
          routeSearch: match.routeSearch,
          search: match.search,
          context: match.context,
          error: match.error,
          paramsError: match.paramsError,
          searchError: match.searchError,
          params: match.params,
          preloadMaxAge: 0,
        }))
      })
    }

    let firstBadMatchIndex: number | undefined

    // Check each match middleware to see if the route can be accessed
    try {
      for (const [index, match] of getFreshMatches().entries()) {
        const parentMatch = getFreshMatches()[index - 1]
        const route = this.getRoute(match.routeId)

        const handleError = (err: any, code: string) => {
          err.routerCode = code
          firstBadMatchIndex = firstBadMatchIndex ?? index

          if (isRedirect(err)) {
            throw err
          }

          try {
            route.options.onError?.(err)
          } catch (errorHandlerErr) {
            err = errorHandlerErr

            if (isRedirect(errorHandlerErr)) {
              throw errorHandlerErr
            }
          }

          this.setRouteMatch(match.id, (s) => ({
            ...s,
            error: err,
            status: 'error',
            updatedAt: Date.now(),
          }))
        }

        if (match.paramsError) {
          handleError(match.paramsError, 'PARSE_PARAMS')
        }

        if (match.searchError) {
          handleError(match.searchError, 'VALIDATE_SEARCH')
        }

        let didError = false

        const parentContext =
          parentMatch?.context ?? this?.options.context ?? {}

        try {
          let beforeLoadContext: any = {}

          const beforeLoadFns = Array.isArray(route.options.beforeLoad)
            ? route.options.beforeLoad
            : [route.options.beforeLoad]

          for (let i = 0; i < beforeLoadFns.length; i++) {
            beforeLoadContext = {
              ...beforeLoadContext,
              ...((await beforeLoadFns[i]?.({
                abortController: match.abortController,
                params: match.params,
                preload: !!opts?.preload,
                context: {
                  ...parentContext,
                  ...match.loaderContext,
                },
              })) ?? ({} as any)),
            }
          }

          const context = {
            ...parentContext,
            ...match.loaderContext,
            ...beforeLoadContext,
          }

          this.setRouteMatch(match.id, (s) => ({
            ...s,
            context: replaceEqualDeep(s.context, context),
          }))
        } catch (err) {
          handleError(err, 'BEFORE_LOAD')
          didError = true
        }

        // If we errored, do not run the next matches' middleware
        if (didError) {
          break
        }
      }
    } catch (err) {
      if (isRedirect(err)) {
        if (!opts?.preload) this.navigate(err as any)
        return
      }

      throw err
    }

    const validResolvedMatches = getFreshMatches().slice(0, firstBadMatchIndex)
    const matchPromises: Promise<any>[] = []

    validResolvedMatches.forEach((match, index) => {
      matchPromises.push(
        (async () => {
          const parentMatchPromise = matchPromises[index - 1]
          const route = this.getRoute(match.routeId)

          if (
            match.isFetching ||
            (match.status === 'success' &&
              !isMatchInvalid(match, {
                preload: opts?.preload,
              }))
          ) {
            return this.getRouteMatch(match.id)?.loadPromise
          }

          const fetchedAt = Date.now()
          const checkLatest = () => {
            const latest = this.getRouteMatch(match.id)
            return latest && latest.fetchedAt !== fetchedAt
              ? latest.loadPromise
              : undefined
          }

          const handleIfRedirect = (err: any) => {
            if (isRedirect(err)) {
              if (!opts?.preload) {
                this.navigate(err as any)
              }
              return true
            }
            return false
          }

          const load = async () => {
            let latestPromise

            try {
              const componentsPromise = Promise.all(
                componentTypes.map(async (type) => {
                  const component = route.options[type]

                  if ((component as any)?.preload) {
                    await (component as any).preload()
                  }
                }),
              )

              const loaderPromise = route.options.loader?.({
                params: match.params,
                preload: !!opts?.preload,
                parentMatchPromise,
                abortController: match.abortController,
                context: match.context,
              })

              const [_, loader] = await Promise.all([
                componentsPromise,
                loaderPromise,
              ])
              if ((latestPromise = checkLatest())) return await latestPromise

              this.setRouteMatchData(match.id, () => loader, opts)
            } catch (error) {
              if ((latestPromise = checkLatest())) return await latestPromise
              if (handleIfRedirect(error)) return

              try {
                route.options.onError?.(error)
              } catch (onErrorError) {
                error = onErrorError
                if (handleIfRedirect(onErrorError)) return
              }

              this.setRouteMatch(match.id, (s) => ({
                ...s,
                error,
                status: 'error',
                isFetching: false,
                updatedAt: Date.now(),
              }))
            }
          }

          let loadPromise: Promise<void> | undefined

          this.__store.batch(() => {
            this.setRouteMatch(match.id, (s) => ({
              ...s,
              // status: s.status !== 'success' ? 'pending' : s.status,
              isFetching: true,
              fetchedAt,
              invalid: false,
            }))

            loadPromise = load()

            this.setRouteMatch(match.id, (s) => ({
              ...s,
              loadPromise,
            }))
          })

          await loadPromise
        })(),
      )
    })

    await Promise.all(matchPromises)
  }

  resolvePath = (from: string, path: string) => {
    return resolvePath(this.basepath!, from, cleanPath(path))
  }

  navigate = async <
    TFrom extends RoutePaths<TRouteTree> = '/',
    TTo extends string = '',
    TMaskFrom extends RoutePaths<TRouteTree> = TFrom,
    TMaskTo extends string = '',
  >({
    from,
    to = '' as any,
    ...rest
  }: NavigateOptions<TRouteTree, TFrom, TTo, TMaskFrom, TMaskTo>) => {
    // If this link simply reloads the current route,
    // make sure it has a new key so it will trigger a data refresh

    // If this `to` is a valid external URL, return
    // null for LinkUtils
    const toString = String(to)
    const fromString = typeof from === 'undefined' ? from : String(from)
    let isExternal

    try {
      new URL(`${toString}`)
      isExternal = true
    } catch (e) {}

    invariant(
      !isExternal,
      'Attempting to navigate to external url with this.navigate!',
    )

    return this.#buildAndCommitLocation({
      ...rest,
      from: fromString,
      to: toString,
    })
  }

  matchRoute = <
    TRouteTree extends AnyRoute = AnyRoute,
    TFrom extends RoutePaths<TRouteTree> = '/',
    TTo extends string = '',
    TResolved = ResolveRelativePath<TFrom, NoInfer<TTo>>,
  >(
    location: ToOptions<TRouteTree, TFrom, TTo>,
    opts?: MatchRouteOptions,
  ): false | RouteById<TRouteTree, TResolved>['types']['allParams'] => {
    location = {
      ...location,
      to: location.to
        ? this.resolvePath(location.from ?? '', location.to)
        : undefined,
    } as any

    const next = this.buildLocation(location)
    if (opts?.pending && this.state.status !== 'pending') {
      return false
    }

    const baseLocation = opts?.pending
      ? this.state.location
      : this.state.resolvedLocation

    if (!baseLocation) {
      return false
    }

    const match = matchPathname(this.basepath, baseLocation.pathname, {
      ...opts,
      to: next.pathname,
    }) as any

    if (!match) {
      return false
    }

    if (opts?.includeSearch ?? true) {
      return partialDeepEqual(baseLocation.search, next.search) ? match : false
    }

    return match
  }

  buildLink = <
    TFrom extends RoutePaths<TRouteTree> = '/',
    TTo extends string = '',
  >(
    dest: LinkOptions<TRouteTree, TFrom, TTo>,
  ): LinkInfo => {
    // If this link simply reloads the current route,
    // make sure it has a new key so it will trigger a data refresh

    // If this `to` is a valid external URL, return
    // null for LinkUtils

    const {
      to,
      preload: userPreload,
      preloadDelay: userPreloadDelay,
      activeOptions,
      disabled,
      target,
      replace,
      resetScroll,
    } = dest

    try {
      new URL(`${to}`)
      return {
        type: 'external',
        href: to as any,
      }
    } catch (e) {}

    const nextOpts = dest

    const next = this.buildLocation(nextOpts)

    const preload = userPreload ?? this.options.defaultPreload
    const preloadDelay =
      userPreloadDelay ?? this.options.defaultPreloadDelay ?? 0

    // Compare path/hash for matches
    const currentPathSplit = this.state.location.pathname.split('/')
    const nextPathSplit = next.pathname.split('/')
    const pathIsFuzzyEqual = nextPathSplit.every(
      (d, i) => d === currentPathSplit[i],
    )
    // Combine the matches based on user options
    const pathTest = activeOptions?.exact
      ? this.state.location.pathname === next.pathname
      : pathIsFuzzyEqual
    const hashTest = activeOptions?.includeHash
      ? this.state.location.hash === next.hash
      : true
    const searchTest =
      activeOptions?.includeSearch ?? true
        ? partialDeepEqual(this.state.location.search, next.search)
        : true

    // The final "active" test
    const isActive = pathTest && hashTest && searchTest

    // The click handler
    const handleClick = (e: MouseEvent) => {
      if (
        !disabled &&
        !isCtrlEvent(e) &&
        !e.defaultPrevented &&
        (!target || target === '_self') &&
        e.button === 0
      ) {
        e.preventDefault()

        // All is well? Navigate!
        this.#commitLocation({ ...next, replace, resetScroll })
      }
    }

    // The click handler
    const handleFocus = (e: MouseEvent) => {
      if (preload) {
        this.preloadRoute(nextOpts).catch((err) => {
          console.warn(err)
          console.warn(preloadWarning)
        })
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      this.preloadRoute(nextOpts).catch((err) => {
        console.warn(err)
        console.warn(preloadWarning)
      })
    }

    const handleEnter = (e: MouseEvent) => {
      const target = (e.target || {}) as LinkCurrentTargetElement

      if (preload) {
        if (target.preloadTimeout) {
          return
        }

        target.preloadTimeout = setTimeout(() => {
          target.preloadTimeout = null
          this.preloadRoute(nextOpts).catch((err) => {
            console.warn(err)
            console.warn(preloadWarning)
          })
        }, preloadDelay)
      }
    }

    const handleLeave = (e: MouseEvent) => {
      const target = (e.target || {}) as LinkCurrentTargetElement

      if (target.preloadTimeout) {
        clearTimeout(target.preloadTimeout)
        target.preloadTimeout = null
      }
    }

    return {
      type: 'internal',
      next,
      handleFocus,
      handleClick,
      handleEnter,
      handleLeave,
      handleTouchStart,
      isActive,
      disabled,
    }
  }

  dehydrate = (): DehydratedRouter => {
    return {
      state: {
        matchIds: this.state.matchIds,
        dehydratedMatches: this.state.matches.map((d) =>
          pick(d, [
            'fetchedAt',
            'invalid',
            'preloadMaxAge',
            'maxAge',
            'id',
            'loaderData',
            'status',
            'updatedAt',
          ]),
        ),
      },
    }
  }

  hydrate = async (__do_not_use_server_ctx?: HydrationCtx) => {
    let _ctx = __do_not_use_server_ctx
    // Client hydrates from window
    if (typeof document !== 'undefined') {
      _ctx = window.__TSR_DEHYDRATED__
    }

    invariant(
      _ctx,
      'Expected to find a __TSR_DEHYDRATED__ property on window... but we did not. Did you forget to render <DehydrateRouter /> in your app?',
    )

    const ctx = _ctx
    this.dehydratedData = ctx.payload as any
    this.options.hydrate?.(ctx.payload as any)
    const dehydratedState = ctx.router.state

    let matches = this.matchRoutes(
      this.state.location.pathname,
      this.state.location.search,
    ).map((match) => {
      const dehydratedMatch = dehydratedState.dehydratedMatches.find(
        (d) => d.id === match.id,
      )

      invariant(
        dehydratedMatch,
        `Could not find a client-side match for dehydrated match with id: ${match.id}!`,
      )

      if (dehydratedMatch) {
        return {
          ...match,
          ...dehydratedMatch,
        }
      }
      return match
    })

    this.__store.setState((s) => {
      return {
        ...s,
        matchIds: dehydratedState.matchIds,
        matches,
        matchesById: this.#mergeMatches(s.matchesById, matches),
      }
    })
  }

  injectedHtml: (string | (() => Promise<string> | string))[] = []

  injectHtml = async (html: string | (() => Promise<string> | string)) => {
    this.injectedHtml.push(html)
  }

  dehydrateData = <T>(key: any, getData: T | (() => Promise<T> | T)) => {
    if (typeof document === 'undefined') {
      const strKey = typeof key === 'string' ? key : JSON.stringify(key)

      this.injectHtml(async () => {
        const id = `__TSR_DEHYDRATED__${strKey}`
        const data =
          typeof getData === 'function' ? await (getData as any)() : getData
        return `<script id='${id}' suppressHydrationWarning>window["__TSR_DEHYDRATED__${escapeJSON(
          strKey,
        )}"] = ${JSON.stringify(data)}
        ;(() => {
          var el = document.getElementById('${id}')
          el.parentElement.removeChild(el)
        })()
        </script>`
      })

      return () => this.hydrateData<T>(key)
    }

    return () => undefined
  }

  hydrateData = <T = unknown>(key: any) => {
    if (typeof document !== 'undefined') {
      const strKey = typeof key === 'string' ? key : JSON.stringify(key)

      return window[`__TSR_DEHYDRATED__${strKey}` as any] as T
    }

    return undefined
  }

  // resolveMatchPromise = (matchId: string, key: string, value: any) => {
  //   this.state.matches
  //     .find((d) => d.id === matchId)
  //     ?.__promisesByKey[key]?.resolve(value)
  // }

  #processRoutes = (routeTree: TRouteTree) => {
    this.routeTree = routeTree as any
    this.routesById = {} as any
    this.routesByPath = {} as any
    this.flatRoutes = [] as any

    const recurseRoutes = (routes: AnyRoute[]) => {
      routes.forEach((route, i) => {
        route.init({ originalIndex: i, router: this })

        const existingRoute = (this.routesById as any)[route.id]

        invariant(
          !existingRoute,
          `Duplicate routes found with id: ${String(route.id)}`,
        )
        ;(this.routesById as any)[route.id] = route

        if (!route.isRoot && route.path) {
          const trimmedFullPath = trimPathRight(route.fullPath)
          if (
            !(this.routesByPath as any)[trimmedFullPath] ||
            route.fullPath.endsWith('/')
          ) {
            ;(this.routesByPath as any)[trimmedFullPath] = route
          }
        }

        const children = route.children as Route[]

        if (children?.length) {
          recurseRoutes(children)
        }
      })
    }

    recurseRoutes([routeTree])

    this.flatRoutes = (Object.values(this.routesByPath) as AnyRoute[])
      .map((d, i) => {
        const trimmed = trimPath(d.fullPath)
        const parsed = parsePathname(trimmed)

        while (parsed.length > 1 && parsed[0]?.value === '/') {
          parsed.shift()
        }

        const score = parsed.map((d) => {
          if (d.type === 'param') {
            return 0.5
          }

          if (d.type === 'wildcard') {
            return 0.25
          }

          return 1
        })

        return { child: d, trimmed, parsed, index: i, score }
      })
      .sort((a, b) => {
        let isIndex = a.trimmed === '/' ? 1 : b.trimmed === '/' ? -1 : 0

        if (isIndex !== 0) return isIndex

        const length = Math.min(a.score.length, b.score.length)

        // Sort by length of score
        if (a.score.length !== b.score.length) {
          return b.score.length - a.score.length
        }

        // Sort by min available score
        for (let i = 0; i < length; i++) {
          if (a.score[i] !== b.score[i]) {
            return b.score[i]! - a.score[i]!
          }
        }

        // Sort by min available parsed value
        for (let i = 0; i < length; i++) {
          if (a.parsed[i]!.value !== b.parsed[i]!.value) {
            return a.parsed[i]!.value! > b.parsed[i]!.value! ? 1 : -1
          }
        }

        // Sort by length of trimmed full path
        if (a.trimmed !== b.trimmed) {
          return a.trimmed > b.trimmed ? 1 : -1
        }

        // Sort by original index
        return a.index - b.index
      })
      .map((d, i) => {
        d.child.rank = i
        return d.child
      }) as any
  }

  #parseLocation = (
    previousLocation?: ParsedLocation,
  ): ParsedLocation<FullSearchSchema<TRouteTree>> => {
    const parse = ({
      pathname,
      search,
      hash,
      state,
    }: HistoryLocation): ParsedLocation<FullSearchSchema<TRouteTree>> => {
      const parsedSearch = this.options.parseSearch(search)

      return {
        pathname: pathname,
        searchStr: search,
        search: replaceEqualDeep(previousLocation?.search, parsedSearch) as any,
        hash: hash.split('#').reverse()[0] ?? '',
        href: `${pathname}${search}${hash}`,
        state: replaceEqualDeep(previousLocation?.state, state) as HistoryState,
      }
    }

    const location = parse(this.history.location)

    let { __tempLocation, __tempKey } = location.state

    if (__tempLocation && (!__tempKey || __tempKey === this.tempLocationKey)) {
      // Sync up the location keys
      const parsedTempLocation = parse(__tempLocation) as any
      parsedTempLocation.state.key = location.state.key

      delete parsedTempLocation.state.__tempLocation

      return {
        ...parsedTempLocation,
        maskedLocation: location,
      }
    }

    return location
  }

  buildLocation = (opts: BuildNextOptions = {}): ParsedLocation => {
    const build = (
      dest: BuildNextOptions & {
        unmaskOnReload?: boolean
      } = {},
      matches?: AnyRouteMatch[],
    ): ParsedLocation => {
      const from = this.state.location

      const fromPathname = dest.from ?? from.pathname

      let pathname = resolvePath(
        this.basepath ?? '/',
        fromPathname,
        `${dest.to ?? ''}`,
      )

      const fromMatches = this.matchRoutes(fromPathname, from.search)

      const prevParams = { ...last(fromMatches)?.params }

      let nextParams =
        (dest.params ?? true) === true
          ? prevParams
          : functionalUpdate(dest.params!, prevParams)

      if (nextParams) {
        matches
          ?.map((d) => this.getRoute(d.routeId).options.stringifyParams)
          .filter(Boolean)
          .forEach((fn) => {
            nextParams = { ...nextParams!, ...fn!(nextParams!) }
          })
      }

      pathname = interpolatePath(pathname, nextParams ?? {})

      const preSearchFilters =
        matches
          ?.map(
            (match) =>
              this.getRoute(match.routeId).options.preSearchFilters ?? [],
          )
          .flat()
          .filter(Boolean) ?? []

      const postSearchFilters =
        matches
          ?.map(
            (match) =>
              this.getRoute(match.routeId).options.postSearchFilters ?? [],
          )
          .flat()
          .filter(Boolean) ?? []

      // Pre filters first
      const preFilteredSearch = preSearchFilters?.length
        ? preSearchFilters?.reduce(
            (prev, next) => next(prev) as any,
            from.search,
          )
        : from.search

      // Then the link/navigate function
      const destSearch =
        dest.search === true
          ? preFilteredSearch // Preserve resolvedFrom true
          : dest.search
          ? functionalUpdate(dest.search, preFilteredSearch) ?? {} // Updater
          : preSearchFilters?.length
          ? preFilteredSearch // Preserve resolvedFrom filters
          : {}

      // Then post filters
      const postFilteredSearch = postSearchFilters?.length
        ? postSearchFilters.reduce((prev, next) => next(prev), destSearch)
        : destSearch

      const search = replaceEqualDeep(from.search, postFilteredSearch)

      const searchStr = this.options.stringifySearch(search)

      const hash =
        dest.hash === true
          ? from.hash
          : dest.hash
          ? functionalUpdate(dest.hash!, from.hash)
          : from.hash

      const hashStr = hash ? `#${hash}` : ''

      let nextState =
        dest.state === true
          ? from.state
          : dest.state
          ? functionalUpdate(dest.state, from.state)
          : from.state

      nextState = replaceEqualDeep(from.state, nextState)

      return {
        pathname,
        search,
        searchStr,
        state: nextState as any,
        hash,
        href: this.history.createHref(`${pathname}${searchStr}${hashStr}`),
        unmaskOnReload: dest.unmaskOnReload,
      }
    }

    const buildWithMatches = (
      dest: BuildNextOptions = {},
      maskedDest?: BuildNextOptions,
    ) => {
      let next = build(dest)
      let maskedNext = maskedDest ? build(maskedDest) : undefined

      if (!maskedNext) {
        let params = {}

        let foundMask = this.options.routeMasks?.find((d) => {
          const match = matchPathname(this.basepath, next.pathname, {
            to: d.from,
            fuzzy: false,
          })

          if (match) {
            params = match
            return true
          }

          return false
        })

        if (foundMask) {
          foundMask = {
            ...foundMask,
            from: interpolatePath(foundMask.from, params) as any,
          }
          maskedDest = foundMask
          maskedNext = build(maskedDest)
        }
      }

      const nextMatches = this.matchRoutes(next.pathname, next.search)
      const maskedMatches = maskedNext
        ? this.matchRoutes(maskedNext.pathname, maskedNext.search)
        : undefined
      const maskedFinal = maskedNext
        ? build(maskedDest, maskedMatches)
        : undefined

      const final = build(dest, nextMatches)

      if (maskedFinal) {
        final.maskedLocation = maskedFinal
      }

      return final
    }

    if (opts.mask) {
      return buildWithMatches(opts, {
        ...pick(opts, ['from']),
        ...opts.mask,
      })
    }

    return buildWithMatches(opts)
  }

  #buildAndCommitLocation = ({
    replace,
    resetScroll,
    ...rest
  }: BuildNextOptions & CommitLocationOptions = {}) => {
    const location = this.buildLocation(rest)
    return this.#commitLocation({
      ...location,
      replace,
      resetScroll,
    })
  }

  #commitLocation = async (next: ParsedLocation & CommitLocationOptions) => {
    if (this.navigateTimeout) clearTimeout(this.navigateTimeout)

    let nextAction: 'push' | 'replace' = 'replace'

    if (!next.replace) {
      nextAction = 'push'
    }

    const isSameUrl = this.state.location.href === next.href

    if (isSameUrl) {
      nextAction = 'replace'
    }

    let { maskedLocation, ...nextHistory } = next

    if (maskedLocation) {
      nextHistory = {
        ...maskedLocation,
        state: {
          ...maskedLocation.state,
          __tempKey: undefined,
          __tempLocation: {
            ...nextHistory,
            search: nextHistory.searchStr,
            state: {
              ...nextHistory.state,
              __tempKey: undefined!,
              __tempLocation: undefined!,
              key: undefined!,
            },
          },
        },
      }

      if (nextHistory.unmaskOnReload ?? this.options.unmaskOnReload ?? false) {
        nextHistory.state.__tempKey = this.tempLocationKey
      }
    }

    this.history[nextAction === 'push' ? 'push' : 'replace'](
      nextHistory.href,
      nextHistory.state,
    )

    this.resetNextScroll = next.resetScroll ?? true

    return this.latestLoadPromise
  }

  getRouteMatch = (id: string): undefined | RouteMatch<TRouteTree> => {
    return this.state.matchesById[id]
  }

  setRouteMatch = (
    id: string,
    updater: (prev: RouteMatch<TRouteTree>) => RouteMatch<TRouteTree>,
  ) => {
    this.__store.setState((prev) => {
      if (!prev.matchesById[id]) {
        return prev
      }

      return {
        ...prev,
        matchesById: {
          ...prev.matchesById,
          [id]: updater(prev.matchesById[id] as any),
        },
      }
    })
  }

  setRouteMatchData = (
    id: string,
    updater: (prev: any) => any,
    opts?: {
      updatedAt?: number
      maxAge?: number
    },
  ) => {
    const match = this.getRouteMatch(id)

    if (!match) return

    const route = this.getRoute(match.routeId)
    const updatedAt = opts?.updatedAt ?? Date.now()

    const preloadMaxAge =
      opts?.maxAge ??
      route.options.preloadMaxAge ??
      this.options.defaultPreloadMaxAge ??
      5000

    const maxAge =
      opts?.maxAge ?? route.options.maxAge ?? this.options.defaultMaxAge ?? -1

    this.setRouteMatch(id, (s) => ({
      ...s,
      error: undefined,
      status: 'success',
      isFetching: false,
      updatedAt: updatedAt,
      loaderData: functionalUpdate(updater, s.loaderData),
      preloadMaxAge,
      maxAge,
    }))
  }

  invalidate = async (opts?: {
    matchId?: string
    reload?: boolean
    __fromFocus?: boolean
  }): Promise<void> => {
    if (opts?.matchId) {
      this.setRouteMatch(opts.matchId, (s) => ({
        ...s,
        invalid: true,
      }))

      const matchIndex = this.state.matches.findIndex(
        (d) => d.id === opts.matchId,
      )
      const childMatch = this.state.matches[matchIndex + 1]

      if (childMatch) {
        return this.invalidate({
          matchId: childMatch.id,
          reload: false,
          __fromFocus: opts.__fromFocus,
        })
      }
    } else {
      this.__store.batch(() => {
        Object.values(this.state.matchesById).forEach((match) => {
          const route = this.getRoute(match.routeId)
          const shouldInvalidate = opts?.__fromFocus
            ? route.options.reloadOnWindowFocus ?? true
            : true

          if (shouldInvalidate) {
            this.setRouteMatch(match.id, (s) => ({
              ...s,
              invalid: true,
            }))
          }
        })
      })
    }

    if (opts?.reload ?? true) {
      return this.load()
    }
  }
}

// Detect if we're in the DOM
const isServer = typeof window === 'undefined' || !window.document.createElement

function getInitialRouterState(): RouterState<any> {
  return {
    status: 'idle',
    isFetching: false,
    resolvedLocation: null!,
    location: null!,
    matchesById: {},
    matchIds: [],
    pendingMatchIds: [],
    matches: [],
    pendingMatches: [],
    renderedMatchIds: [],
    renderedMatches: [],
    lastUpdated: Date.now(),
  }
}

function isCtrlEvent(e: MouseEvent) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
}

export type AnyRedirect = Redirect<any, any, any>

export type Redirect<
  TRouteTree extends AnyRoute = RegisteredRouter['routeTree'],
  TFrom extends RoutePaths<TRouteTree> = '/',
  TTo extends string = '',
  TMaskFrom extends RoutePaths<TRouteTree> = TFrom,
  TMaskTo extends string = '',
> = NavigateOptions<TRouteTree, TFrom, TTo, TMaskFrom, TMaskTo> & {
  code?: number
}

export function redirect<
  TRouteTree extends AnyRoute = RegisteredRouter['routeTree'],
  TFrom extends RoutePaths<TRouteTree> = '/',
  TTo extends string = '',
>(opts: Redirect<TRouteTree, TFrom, TTo>): Redirect<TRouteTree, TFrom, TTo> {
  ;(opts as any).isRedirect = true
  return opts
}

export function isRedirect(obj: any): obj is AnyRedirect {
  return !!obj?.isRedirect
}

export class SearchParamError extends Error {}
export class PathParamError extends Error {}

function escapeJSON(jsonString: string) {
  return jsonString
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/'/g, "\\'") // Escape single quotes
    .replace(/"/g, '\\"') // Escape double quotes
}

// A function that takes an import() argument which is a function and returns a new function that will
// proxy arguments from the caller to the imported function, retaining all type
// information along the way
export function lazyFn<
  T extends Record<string, (...args: any[]) => any>,
  TKey extends keyof T = 'default',
>(fn: () => Promise<T>, key?: TKey) {
  return async (...args: Parameters<T[TKey]>): Promise<ReturnType<T[TKey]>> => {
    const imported = await fn()
    return imported[key || 'default'](...args)
  }
}

export function isMatchInvalid(
  match: AnyRouteMatch,
  opts?: { preload?: boolean },
) {
  const now = Date.now()

  if (match.invalid) {
    return true
  }

  if (opts?.preload) {
    return match.preloadMaxAge < 0
      ? false
      : match.updatedAt + match.preloadMaxAge < now
  }

  return match.maxAge < 0 ? false : match.updatedAt + match.maxAge < now
}
