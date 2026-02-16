import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
// internal
import { CartTwo, Menu, Search, User, Wishlist } from '@/svg';
import Menus from './header-com/menus';
import logo_white from '@assets/img/logo/logo-white.svg';
import logo_dark from '@assets/img/logo/logo.svg';
import useSticky from '@/hooks/use-sticky';
import SearchBar from './header-com/search-bar';
import OffCanvas from '@/components/common/off-canvas';
import useCartInfo from '@/hooks/use-cart-info';
import CartMiniSidebar from '@/components/common/cart-mini-sidebar';
import { openCartMini } from '@/redux/features/cartSlice';
import { userLoggedOut } from '@/redux/features/auth/authSlice';

const HeaderFour = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isOffCanvasOpen, setIsCanvasOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { quantity } = useCartInfo();
  const { sticky } = useSticky();

  const dispatch = useDispatch();
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header>
        <div
          id="header-sticky"
          className={`tp-header-area tp-header-style-transparent-white tp-header-sticky tp-header-transparent has-dark-logo tp-header-height ${sticky ? 'header-sticky' : ''}`}
        >
          <div className="tp-header-bottom-3 pl-85 pr-85">
            <div className="container-fluid">
              <div className="row align-items-center">
                <div className="col-xl-2 col-lg-2 col-6">
                  <div className="logo">
                    <Link href="/">
                      <Image className="logo-light" src={logo_white} alt="logo" />
                      <Image className="logo-dark" src={logo_dark} alt="logo" />
                    </Link>
                  </div>
                </div>
                <div className="col-xl-8 col-lg-8 d-none d-lg-block">
                  <div className="main-menu menu-style-3 menu-style-4 p-relative">
                    <nav className="tp-main-menu-content">
                      <Menus />
                    </nav>
                  </div>
                </div>
                <div className="col-xl-2 col-lg-2 col-6">
                  <div className="tp-header-action d-flex align-items-center justify-content-end ml-50">
                    <div className="tp-header-action-item d-none d-sm-block">
                      <button
                        onClick={() => setIsSearchOpen(true)}
                        type="button"
                        className="tp-header-action-btn tp-search-open-btn"
                      >
                        <Search />
                      </button>
                    </div>
                    {/* <div className="tp-header-action-item d-none d-sm-block">
                      <Link href="/wishlist" className="tp-header-action-btn">
                        <Wishlist />
                        <span className="tp-header-action-badge">{wishlist.length}</span>
                      </Link>
                    </div> */}
                    <div className="tp-header-action-item d-none d-sm-block">
                      <button
                        onClick={() => dispatch(openCartMini())}
                        type="button"
                        className="tp-header-action-btn cartmini-open-btn"
                      >
                        <CartTwo />
                        <span className="tp-header-action-badge">{quantity}</span>
                      </button>
                    </div>

                    <div className="tp-header-action-item d-none d-sm-block p-relative" ref={profileRef}>
                      <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        type="button"
                        className="tp-header-action-btn"
                      >
                        <User />
                      </button>

                      {isProfileOpen && (
                        <div className="profile-dropdown">
                          {!user ? (
                            <Link href="/login" className="dropdown-item">
                              Login
                            </Link>
                          ) : (
                            <>
                              <Link href="/profile" className="dropdown-item">
                                My Profile
                              </Link>
                              <button className="dropdown-item" onClick={() => dispatch(userLoggedOut())}>
                                Logout
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="tp-header-action-item d-lg-none">
                      <button onClick={() => setIsCanvasOpen(true)} type="button" className="tp-offcanvas-open-btn">
                        <Menu />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* search bar start */}
      <SearchBar isSearchOpen={isSearchOpen} setIsSearchOpen={setIsSearchOpen} />
      {/* search bar end */}

      {/* cart mini sidebar start */}
      <CartMiniSidebar />
      {/* cart mini sidebar end */}

      {/* off canvas start */}
      <OffCanvas isOffCanvasOpen={isOffCanvasOpen} setIsCanvasOpen={setIsCanvasOpen} categoryType="jewelry" />
      {/* off canvas end */}
    </>
  );
};

export default HeaderFour;
