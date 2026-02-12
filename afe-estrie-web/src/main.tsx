import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


// TODO
// - [ ] Open same page when clicking a link in the app (e.g. from the home page to the about page) instead of opening a new tab
// - [ ] Check why is not updating the page link after updates in dashboard
// - [ ] Allow to update the url in the PageManager section of the dashboard
// - [ ] Save the policies in the local storage and load them on page load
// - [ ] Change videos in the hero section of the home page
// - [ ] Add social media links
// - [ ] Double check the modal for become member
