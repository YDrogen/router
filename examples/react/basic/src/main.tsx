import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  Outlet,
  RouterProvider,
  Link,
  Route,
  ErrorComponent,
  Router,
  RouterContext,
  RouterMeta,
} from '@tanstack/react-router'
import {
  QueryClient,
  QueryClientProvider,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import axios from 'axios'

type PostType = {
  id: string
  title: string
  body: string
}

const fetchPosts = async () => {
  console.log('Fetching posts...')
  await new Promise((r) => setTimeout(r, 500))
  return axios
    .get<PostType[]>('https://jsonplaceholder.typicode.com/posts')
    .then((r) => r.data.slice(0, 10))
}

const fetchPost = async (postId: string) => {
  console.log(`Fetching post with id ${postId}...`)
  await new Promise((r) => setTimeout(r, 500))
  const post = await axios
    .get<PostType>(`https://jsonplaceholder.typicode.com/posts/${postId}`)
    .then((r) => r.data)

  if (!post) {
    throw new NotFoundError(`Post with id "${postId}" not found!`)
  }

  return post
}

const routerMeta = new RouterMeta<{
  queryClient: QueryClient
}>()

const rootRoute = routerMeta.createRootRoute({
  component: () => {
    return (
      <>
        <div className="p-2 flex gap-2 text-lg">
          <Link
            to="/"
            activeProps={{
              className: 'font-bold',
            }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>{' '}
          <Link
            to={'/posts'}
            activeProps={{
              className: 'font-bold',
            }}
          >
            Posts
          </Link>
        </div>
        <hr />
        <Outlet />
        {/* Start rendering router matches */}
        {/* <TanStackRouterDevtools position="bottom-right" /> */}
      </>
    )
  },
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => {
    return (
      <div className="p-2">
        <h3>Welcome Home!</h3>
      </div>
    )
  },
})

const postsRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'posts',
  beforeLoad: () => ({
    queryOpts: {
      queryKey: ['posts'],
      queryFn: () => fetchPosts(),
    } as const,
  }),
  load: ({ meta: { queryClient, queryOpts } }) =>
    queryClient.ensureQueryData(queryOpts),
  component: ({ useRouteMeta }) => {
    const { queryOpts } = useRouteMeta()

    const postsQuery = useSuspenseQuery({
      ...queryOpts,
      staleTime: 10 * 1000,
    })

    const posts = postsQuery.data

    return (
      <div className="p-2 flex gap-2">
        <ul className="list-disc pl-4">
          {[
            ...posts,
            { id: 'i-do-not-exist', title: 'Non-existent Post' },
          ]?.map((post) => {
            return (
              <li key={post.id} className="whitespace-nowrap">
                <Link
                  to={postRoute.to}
                  params={{
                    postId: post.id,
                  }}
                  className="block py-1 text-blue-800 hover:text-blue-600"
                  activeProps={{ className: 'text-black font-bold' }}
                >
                  <div>{post.title.substring(0, 20)}</div>
                </Link>
              </li>
            )
          })}
        </ul>
        <hr />
        <Outlet />
      </div>
    )
  },
})

const postsIndexRoute = new Route({
  getParentRoute: () => postsRoute,
  path: '/',
  component: () => <div>Select a post.</div>,
})

class NotFoundError extends Error {}

const postRoute = new Route({
  getParentRoute: () => postsRoute,
  path: '$postId',
  errorComponent: ({ error }) => {
    if (error instanceof NotFoundError) {
      return <div>{error.message}</div>
    }

    return <ErrorComponent error={error} />
  },
  beforeLoad: ({ params: { postId } }) => ({
    queryOptions: {
      queryKey: ['posts', { postId }],
      queryFn: () => fetchPost(postId),
    } as const,
  }),
  load: ({ meta: { queryClient, queryOptions } }) =>
    queryClient.ensureQueryData(queryOptions),
  component: ({ useRouteMeta }) => {
    const { queryOptions } = useRouteMeta()

    const postQuery = useSuspenseQuery({
      ...queryOptions,
      staleTime: 10 * 1000,
    })

    const post = postQuery.data

    return (
      <div className="space-y-2">
        <h4 className="text-xl font-bold underline">{post.title}</h4>
        <div className="text-sm">{post.body}</div>
      </div>
    )
  },
})

type Test = typeof postRoute.types.routeMeta
type Test2 = typeof postRoute.types.allMeta
type Test3 = typeof postRoute.test

const routeTree = rootRoute.addChildren([
  postsRoute.addChildren([postRoute, postsIndexRoute]),
  indexRoute,
])

const queryClient = new QueryClient()

// Set up a Router instance
const router = new Router({
  routeTree,
  defaultPreload: 'intent',
  meta: {
    queryClient,
  },
})

// Register things for typesafety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
