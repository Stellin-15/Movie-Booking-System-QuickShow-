import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Navbar from './components/NavBar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MyBookings from './pages/MyBookings'
import SeatLayout from './pages/SeatLayout'
import MovieDetails from './pages/MovieDetails'
import Fav from './pages/Favorite'
import {Toaster} from 'react-hot-toast'


export const App = () => {
  
  const isAdminRoute = useLocation().pathname.startsWith('/admin');

  return (
    <>
      <Toaster/>
      {!isAdminRoute && <Navbar/>}
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/movies" element={<Movies/>} />
        <Route path="/movies/:id" element={<MovieDetails/>}/>
        <Route path="/movies/:id/:date" element={<SeatLayout/>} />
        <Route path="/my-bookings" element={<MyBookings/>} />
        <Route path="/favorite" element={<Fav/>} />

      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App








