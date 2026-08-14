"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { Compass, Menu, User as UserIcon, Globe, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { LoginModal, RegisterModal } from "./AuthModals";
import { SearchModal } from "./SearchModal";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const openLogin = () => {
    setDropdownOpen(false);
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const openRegister = () => {
    setDropdownOpen(false);
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    showToast("Logged out successfully.", "info");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border-gray bg-white py-4 shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2 text-brand hover:opacity-90 transition-opacity">
            <Compass size={32} className="stroke-[2]" />
            <span className="hidden sm:inline text-xl font-bold tracking-tight text-brand">
              StayNest
            </span>
          </Link>

          {/* Search Pill (Airbnb Style Mock) */}
          <div
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center border border-border-gray hover:shadow-md transition-shadow rounded-full py-2 px-3 pl-6 gap-3 cursor-pointer shadow-xs bg-white"
          >
            <span className="text-xs font-semibold text-dark">Anywhere</span>
            <span className="text-border-gray">|</span>
            <span className="text-xs font-semibold text-dark">Any week</span>
            <span className="text-border-gray">|</span>
            <span className="text-xs text-muted">Add guests</span>
            <div className="p-2 bg-brand text-white rounded-full">
              <Search size={12} className="stroke-[3]" />
            </div>
          </div>

          {/* User Menu Actions */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            
            {/* Host Dashboard Link */}
            {user ? (
              user.role === "host" ? (
                <Link
                  href="/host"
                  className="hidden md:block text-xs font-semibold hover:bg-light-gray py-2.5 px-4 rounded-full text-dark transition-colors"
                >
                  Host Dashboard
                </Link>
              ) : (
                <Link
                  href="/trips"
                  className="hidden md:block text-xs font-semibold hover:bg-light-gray py-2.5 px-4 rounded-full text-dark transition-colors"
                >
                  My Trips
                </Link>
              )
            ) : (
              <button
                onClick={openLogin}
                className="hidden md:block text-xs font-semibold hover:bg-light-gray py-2.5 px-4 rounded-full text-dark transition-colors"
              >
                Become a Host
              </button>
            )}

            <button className="hidden sm:flex text-muted hover:bg-light-gray p-2.5 rounded-full transition-colors">
              <Globe size={16} />
            </button>

            {/* Profile Dropdown Trigger */}
            <button
              onClick={toggleDropdown}
              className="flex items-center border border-border-gray hover:shadow-md transition-all rounded-full p-1.5 pl-3 gap-3 bg-white"
            >
              <Menu size={16} className="text-dark" />
              <div className="bg-muted text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center overflow-hidden">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon size={14} />
                )}
              </div>
            </button>

            {/* Dropdown Menu Overlay */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-60 rounded-xl bg-white shadow-premium border border-border-gray py-2 flex flex-col z-50 text-sm">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-border-gray mb-1">
                      <p className="font-bold text-dark truncate">Hello, {user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    {user.role === "host" ? (
                      <>
                        <Link
                          href="/host"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left font-semibold"
                        >
                          Manage Listings
                        </Link>
                        <Link
                          href="/host/bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                        >
                          Reservations
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/trips"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left font-semibold"
                        >
                          My Trips
                        </Link>
                        <Link
                          href="/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                        >
                          Wishlist
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-border-gray" />
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 hover:bg-light-gray text-brand text-left font-semibold"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={openRegister}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left font-semibold"
                    >
                      Sign up
                    </button>
                    <button
                      onClick={openLogin}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                    >
                      Log in
                    </button>
                    <hr className="my-1 border-border-gray" />
                    <button
                      onClick={openLogin}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                    >
                      Rent your home
                    </button>
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                    >
                      Help Center
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modals */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        switchToOther={openRegister}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        switchToOther={openLogin}
      />
      <Suspense fallback={null}>
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </Suspense>
    </>
  );
};
export default Navbar;
