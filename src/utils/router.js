class Router {
  constructor() {
    this.routes = {}
    window.addEventListener('hashchange', () => this.handleRouteChange())
  }

  addRoute(path, callback) {
    this.routes[path] = callback
  }

  handleRouteChange() {
    const currentPath = window.location.hash.split('?')[0]
    const routePath = Object.keys(this.routes).find(route => {
      if (route.includes(':')) {
        const basePath = route.split('/:')[0]
        return currentPath.startsWith(basePath)
      }
      return currentPath === route
    })

    if (routePath) {
      if (routePath.includes(':')) {
        const param = currentPath.split('/').pop()
        this.routes[routePath](param)
      } else {
        this.routes[routePath]()
      }
    }
  }

  navigate(path) {
    window.location.hash = path
  }
}

export const navigateTo = (path) => {
  window.location.hash = path
}

export default Router