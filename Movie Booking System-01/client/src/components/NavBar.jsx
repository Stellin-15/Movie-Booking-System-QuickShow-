import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon,SearchIcon,XIcon,TicketPlus} from "lucide-react";
import {useUser,useClerk, UserButton} from "@clerk/clerk-react";

const NavBar = () => {

  const [isOpen, setIsOpen] = React.useState(false);
  const {user} = useUser();
  const {openSignIn} = useClerk();
  let buttonEffect = 'block py-2 px-3 text-gray-900 rounded-sm hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-blue-700 md:p-0 dark:text-white md:dark:hover:text-red-500 dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent'

  const navigate = useNavigate();

  return (
    <div
      className="fixed top-0 left-0 z-50 w-full flex items-center 
    justify-between px-6 md:px-16 lg:px-36 py-5"
    >
      <Link to="/" className="max:md:flex-1">
        <img src={assets.logo} alt="Logo" className="w-36 h-auto" />
      </Link>

      <div className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-8 min-md:px-8 py-3 max-md:h-screen min-md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 ${isOpen ? "max-md:w-full" : "max-md:w-0"}`}>

        <XIcon className="md:hidden absolute top-6 right-6 w-6 h-6 cursor-pointer" onClick ={()=> setIsOpen(!isOpen)}/>
        <Link className = 'block py-2 px-3 text-white bg-blue-700 rounded-sm md:bg-transparent md:text-blue-700 md:p-0 dark:text-white md:dark:text-red-500' onClick ={()=> {scrollTo(0,0), setIsOpen(false)}} to="/">Home</Link>
        <Link className = {buttonEffect} onClick ={()=> {scrollTo(0,0);  setIsOpen(false)}} to="/movies">Movies</Link>
        <Link className = {buttonEffect} onClick ={()=> {scrollTo(0,0); setIsOpen(false)}} to="/">Theaters</Link>
        <Link className = {buttonEffect} onClick ={()=> {scrollTo(0,0); setIsOpen(false)}} to="/">Releases</Link>
        <Link className = {buttonEffect} onClick ={()=> {scrollTo(0,0); setIsOpen(false)}} to="/favorites">Favorites</Link>
      </div>

      <div className="flex items-center gap-8">
        <SearchIcon className = 'max:md:ml-4 md:hidden w-8 h-8 cursor-pointer'/>
        {
          !user ? (
            <button onClick = {openSignIn} className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-medium">
              Login
            </button>
          ) : (<UserButton>

                <UserButton.MenuItems>

                  <UserButton.Action label ="My Bookings" labelIcon = {<TicketPlus width={15}/>} onClick = {()=> navigate('/My-Bookings')}/>
                </UserButton.MenuItems>

            </UserButton>
            )
        }

        
      </div>

      <MenuIcon className="max:md:ml-4 md:hidden w-8 h-8 cursor-pointer" onClick ={()=> setIsOpen(!isOpen)}/>
    </div>

  );
};

export default NavBar;

