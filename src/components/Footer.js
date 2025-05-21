class Footer {
  render() {
    const footer = document.createElement('footer')
    footer.innerHTML = `
      <p>&copy; ${new Date().getFullYear()} Dicoding Story App. All rights reserved.</p>
    `
    return footer
  }
}

export default Footer