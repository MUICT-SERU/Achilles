import { useEffect, useState } from 'react';
import { animateScroll as scroll } from 'react-scroll';
import {
  Box,
  Grid,
  Paper,
  Radio,
  Divider,
  InputBase,
  IconButton,
  Typography,
  RadioGroup,
  FormControlLabel,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import SearchIcon from '@material-ui/icons/Search';
import LockIcon from '@material-ui/icons/Lock';
import PersonSharpIcon from '@material-ui/icons/PersonSharp';
import ExpandMoreRoundedIcon from '@material-ui/icons/ExpandMoreRounded';

import swal from 'sweetalert';
import useDebounce from '../../hooks/useDebounce';
import useRouter from '../../hooks/useRouter';

import HttpUtil from '../../utils/http-util';
import { ROUTE_API, ROUTE_PATH } from '../../utils/route-util';

import Loading from '../../components/Loading';
import { CyanButton, DisabledButton } from '../../components/CustomButton';

import PackageJsonModal from './PackageJsonModal';

interface Project {
  ownerName: string;
  projectName: string;
  cloneUrl: string;
  privateProject: boolean;
}

interface ContributeProject {
  ownerName: string;
  projects: Project[];
}

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(5, 20),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(5, 10),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(5, 3),
    },
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    width: 'auto',
    border: '2px solid rgb(128, 128, 128, 0.5)',
    borderRadius: 50,
    justifyContent: 'space-between',
    padding: theme.spacing(1, 3),
    margin: theme.spacing(2, 0),
  },
  inputRoot: {
    color: 'inherit',
    flex: 1,
  },
  inputInput: {
    width: '100%',
  },
  paperContainer: {
    boxShadow: '0px 1px 5px 0px rgba(169,169,169,0.5)',
    padding: theme.spacing(2, 2),
    borderRadius: theme.spacing(2),
    marginTop: theme.spacing(5),
  },
  paperTitle: {
    marginBottom: theme.spacing(2),
  },
  lockIcon: {
    marginLeft: theme.spacing(0.5),
    width: 15,
    height: 15,
  },
  personIcon: {
    marginRight: theme.spacing(1),
    width: 20,
    height: 20,
  },
  toBottom: {
    zIndex: 2,
    position: 'fixed',
    bottom: '2vh',
    backgroundColor: '#DCDCDC',
    color: '#000',
    '&:hover, &.Mui-focusVisible': {
      transition: '0.3s',
    },
    right: '2%',
  },
}));

const ProjectList: React.FC = () => {
  const classes = useStyles();
  const { goTo } = useRouter();

  const [open, setOpen] = useState(false); // open modal for pacakge json list
  const [isLoading, setLoading] = useState(false);
  const [searchRepo, setSearchRepo] = useState('');
  const [isPackgeJsonLoading, setPackgeJsonLoading] = useState(false);

  const [selectedProject, setSelectedProject] = useState('');
  const [selectedJsonPath, setSelectedJsonPath] = useState('');

  const [paths, setPaths] = useState([]); // path for package json content
  const [packageJsonUrl, setPackgeJsonUrl] = useState('');
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState([]);
  const [contributeProjects, setContributeProjects] = useState([]);

  const [showArrow, setShowArrow] = useState(false);

  const debounceSearch = useDebounce(searchRepo, 500);

  const onScroll = () => {
    const windowHeight =
      'innerHeight' in window
        ? window.innerHeight
        : document.documentElement.offsetHeight;
    const body = document.body;
    const html = document.documentElement;
    const docHeight = Math.max(
      body.scrollHeight,
      body.offsetHeight,
      html.clientHeight,
      html.scrollHeight,
      html.offsetHeight
    );
    const windowBottom = windowHeight + window.pageYOffset;
    if (windowBottom >= docHeight) {
      setShowArrow(false);
    } else {
      setShowArrow(true);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setLoading(true);
    if (debounceSearch) {
      HttpUtil.get(`${ROUTE_API.searchProject}?repoName=${debounceSearch}`)
        .then((response) => {
          const projects = response.data;
          setUserProjects(projects.userProjects);
          setLoading(false);
          onScroll();
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    } else {
      HttpUtil.get(`${ROUTE_API.projects}`)
        .then((response) => {
          const projects = response.data;
          setAllProjects(projects.allProjects);
          setUserProjects(projects.userProjects);
          setContributeProjects(projects.contributeProjects);
          setLoading(false);
          onScroll();
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    }
  }, [debounceSearch]);

  const onSelectedProject = (event: any) => {
    const value = event.target.value;
    setSelectedProject(value);
    setSelectedJsonPath('');
  };

  const onFindVulnerabilities = () => {
    setPackgeJsonLoading(true);
    const index = allProjects.findIndex(
      (item) => item.projectName === selectedProject
    );
    const user = allProjects[index].ownerName;

    HttpUtil.get(
      `${ROUTE_API.isPackgeJson}?&repoName=${selectedProject}&user=${user}`
    )
      .then((response) => {
        setPackgeJsonLoading(false);
        if (!response.data.isPackgeJson) {
          swal(
            'Sorry!',
            'This repository is not allowed to analyze. Please select only the npm project that have package.json file',
            'error'
          );
        } else {
          const packgeJsonUrls = response.data.packgeJsonUrls;
          setPackgeJsonUrl(packgeJsonUrls.contentUrl);
          setPaths(packgeJsonUrls.paths);
          if (packgeJsonUrls.paths.length > 1) setOpen(true);
          else {
            setSelectedJsonPath(packgeJsonUrls.paths[0]);
            onGetPackageJsonContent(packgeJsonUrls.contentUrl);
          }
        }
      })
      .catch((err) => {
        console.log(err);
        setPackgeJsonLoading(false);
      });
  };

  const onGetPackageJsonContent = (url: string) => {
    HttpUtil.get(
      `${ROUTE_API.packageJsonContent}?packageJsonUrl=${url}${
        selectedJsonPath ? selectedJsonPath : 'package.json'
      }`
    )
      .then((response) => {
        setPackgeJsonLoading(false);
        localStorage.setItem(
          'packageJsonContent',
          JSON.stringify({
            repo: selectedProject,
            packageJson: response.data.packageJson,
            jsonPath: selectedJsonPath,
          })
        );
        goTo(ROUTE_PATH.visualization)();
      })
      .catch((err) => {
        console.log(err);
        setPackgeJsonLoading(false);
      });
  };

  const analyzeButton = () => {
    setOpen(false);
    setPackgeJsonLoading(true);
    onGetPackageJsonContent(packageJsonUrl);
  };

  const cancelButton = () => {
    setSelectedJsonPath('');
    setOpen(false);
  };

  const renderProjectList = (projects: Project[]) => {
    return (
      <Grid container direction="row" alignItems="center">
        {projects.map((project: Project, index: number) => {
          return (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <FormControlLabel
                value={project.projectName}
                control={<Radio color="primary" />}
                label={
                  <Box display="flex" flexDirection="row" alignItems="center">
                    <Typography variant="body2">
                      {project.projectName}
                    </Typography>
                    {project.privateProject ? (
                      <LockIcon color="primary" className={classes.lockIcon} />
                    ) : (
                      ''
                    )}
                  </Box>
                }
              />
            </Grid>
          );
        })}
      </Grid>
    );
  };

  return (
    <>
      {(isLoading || isPackgeJsonLoading) && <Loading />}
      <Box className={classes.container}>
        <Typography variant="h5">
          Which GitHub repository do you want to find vulnerabilities?
        </Typography>
        <Box className={classes.searchContainer}>
          <InputBase
            placeholder="Search repositories by name..."
            classes={{
              root: classes.inputRoot,
              input: classes.inputInput,
            }}
            onChange={(e) => setSearchRepo(e.target.value)}
          />
          <SearchIcon fontSize="large" color="primary" />
        </Box>
        <RadioGroup
          aria-label="selected-repo"
          name="selected-repo"
          value={selectedProject}
          onChange={onSelectedProject}
        >
          {isLoading ? (
            ''
          ) : (
            <Paper elevation={0} className={classes.paperContainer}>
              <Box textAlign="center">
                <Typography variant="h6" className={classes.paperTitle}>
                  Personal Repositories
                </Typography>
              </Box>
              <Box>
                {userProjects.length <= 0 && debounceSearch && !isLoading ? (
                  <Box textAlign="center">
                    <Typography variant="body2">
                      No results for search repositories were found
                    </Typography>
                  </Box>
                ) : userProjects.length <= 0 &&
                  !debounceSearch &&
                  !isLoading ? (
                  <Box textAlign="center">
                    <Typography variant="body2">
                      You don't have any personal repositories on GitHub
                    </Typography>
                  </Box>
                ) : (
                  renderProjectList(userProjects)
                )}
              </Box>
            </Paper>
          )}
          {contributeProjects.length > 0 && !isLoading ? (
            <Paper elevation={0} className={classes.paperContainer}>
              <Box textAlign="center">
                <Typography variant="h6" className={classes.paperTitle}>
                  Repositories with contributor access
                </Typography>
              </Box>
              <Box>
                {debounceSearch && !isLoading ? (
                  <Box textAlign="center">
                    <Typography variant="body2">
                      Unable to search the repositories that you are being a
                      contributor on GitHub
                    </Typography>
                  </Box>
                ) : (
                  contributeProjects.map(
                    (project: ContributeProject, index: number) => {
                      return (
                        <Box
                          key={index}
                          mb={index < contributeProjects.length - 1 ? 5 : 0}
                        >
                          <Box
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                          >
                            <PersonSharpIcon
                              color="primary"
                              className={classes.personIcon}
                            />
                            <Typography variant="h6">
                              {project.ownerName}
                            </Typography>
                          </Box>
                          {renderProjectList(project.projects)}
                          {index < contributeProjects.length - 1 ? (
                            <Divider />
                          ) : (
                            ''
                          )}
                        </Box>
                      );
                    }
                  )
                )}
              </Box>
            </Paper>
          ) : (
            ''
          )}
        </RadioGroup>
        {isLoading ||
        (userProjects.length <= 0 && contributeProjects.length <= 0) ? (
          ''
        ) : !isLoading &&
          debounceSearch &&
          userProjects.length <= 0 &&
          !selectedProject ? (
          ''
        ) : (
          <Box textAlign="center" mt={4}>
            {!selectedProject ? (
              <DisabledButton variant="text" disabled>
                Find vulnerabilities
              </DisabledButton>
            ) : (
              <CyanButton variant="contained" onClick={onFindVulnerabilities}>
                Find vulnerabilities
              </CyanButton>
            )}
          </Box>
        )}
      </Box>

      {/* to bottom arrow */}
      {showArrow ? (
        <IconButton
          className={classes.toBottom}
          onClick={() => scroll.scrollToBottom({ smooth: true })}
        >
          <ExpandMoreRoundedIcon fontSize="large" />
        </IconButton>
      ) : (
        ''
      )}

      <PackageJsonModal
        {...{
          open,
          paths,
          selectedJsonPath,
          setSelectedJsonPath,
          cancelButton,
          analyzeButton,
        }}
      />
    </>
  );
};

export default ProjectList;
