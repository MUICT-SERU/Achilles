import { useEffect, useState } from 'react';
import {
  Box,
  AppBar,
  Avatar,
  Hidden,
  Divider,
  Toolbar,
  Typography,
  ButtonBase,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';

import { useDispatch, useSelector } from 'react-redux';
import { userRequest, logoutRequest } from '../../redux/auth/action';
import { userSelector } from '../../redux/auth/selector';

import useRouter from '../../hooks/useRouter';
import { ROUTE_PATH } from '../../utils/route-util';

import SideBar from '../SideBar';

const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    backgroundColor: 'primary',
    boxShadow: '0px 1px 7px 0px rgba(169,169,169,0.5)',
    color: 'white',
  },
  logo: {
    height: 50,
    width: 50,
  },
  divider: {
    background: 'white',
    width: 3,
    height: 25,
    marginTop: theme.spacing(1.8),
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(2),
  },
  userAccName: {
    margin: theme.spacing(0, 3),
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  menuIcon: {
    width: 30,
    height: 30,
  },
  avatar: {
    width: theme.spacing(5),
    height: theme.spacing(5),
    border: '2px solid #fff',
  },
}));

const NavBar: React.FC = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { goTo } = useRouter();
  const access_token = localStorage.getItem('token') || '';

  const [openDrawer, setOpenDrawer] = useState(false);

  const { userData } = useSelector(userSelector);

  useEffect(() => {
    dispatch(userRequest());
  }, [dispatch, access_token]);

  const onLogout = () => {
    dispatch(logoutRequest());
    goTo(ROUTE_PATH.login)();
  };

  const onLogoClick = () => {
    goTo(ROUTE_PATH.root)();
  };

  return (
    <>
      <AppBar className={classes.appBar}>
        <Toolbar>
          <ButtonBase
            className={classes.menuButton}
            onClick={() => setOpenDrawer(true)}
          >
            <MenuRoundedIcon className={classes.menuIcon} />
          </ButtonBase>
          <ButtonBase onClick={onLogoClick}>
            <Avatar
              src={
                '/images/' +
                (process.env.NODE_ENV === 'development'
                  ? 'achilles-logo-dev-no-bg.png'
                  : 'achilles-logo-no-bg.png')
              }
              className={classes.logo}
              alt="Achilles logo"
            />
            <Divider
              orientation="vertical"
              flexItem
              className={classes.divider}
            />
            <Typography variant="h5">Achilles</Typography>
          </ButtonBase>
          <Box flexGrow={1} />
          <Hidden xsDown>
            <ButtonBase onClick={onLogout}>
              <Typography variant="body1">Logout</Typography>
            </ButtonBase>
            <Typography variant="body1" className={classes.userAccName}>
              {userData ? userData?.username : ''}
            </Typography>
          </Hidden>

          <Avatar
            alt="User profile"
            src={userData?.profilePicture}
            className={classes.avatar}
          />
        </Toolbar>
      </AppBar>

      {userData ? <SideBar {...{ userData, openDrawer, setOpenDrawer }} /> : ''}
    </>
  );
};

export default NavBar;
