import axios from 'axios';
import RJSON from 'relaxed-json';
import { Card, Collapse } from 'react-bootstrap';
import React, { Component } from 'react';

import Autosuggestion from './components/Autosuggestion';
import FilterTag from './components/FilterTag';
import Tag from './components/Tag'

import './App.css';

const CORS = 'https://cors-anywhere.herokuapp.com/';

function checkCheckboxState(arr, idx) {
  if (arr[idx] !== '' && arr[idx] !== false) return true;
  else return false;
}

function getCompanyJSON(jsonURL) {
  return axios.get(`${CORS}${jsonURL}`);
}

function processCompanyData(companyData, locations) {

  // Check if company has jobs listed. If not, skip.
  if (companyData.jobs.listings && companyData.jobs.listings.length > 0) {

    // Add companyObj to companies array
    // Add company name to autosuggest array
    let company = companyData.company;
    let autosuggestions = [company.name];

    // Add company location to locations array if location doesn't already exist
    if (locations.indexOf(company.location) === -1 && !!company.location) {
      locations.push(company.location)
    } else if (!company.location) {
      console.log(`WARNING: No location found for "${company.name}"`);
      return;
    }

    // Loop through company's jobs and add company name, URL, location to each jobObj 
    let jobs = companyData.jobs.listings.map(jb => {
      jb.company = company.name;
      jb.company_url = company.url;
      jb.location = company.location;

      // Add job title to autosuggest array
      autosuggestions.push(jb.title);
      return jb;
    });

    return {
      locations,
      company,
      autosuggestions,
      jobs
    }

  } else {
    console.log(`No jobs found: Skipped job listings for "${companyData.company.name}"`);
    return;
  }
}

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      data: {
        disciplines: [],
        levels: [],
        locations: [],
        companies: [],
        autosuggest: [],
        jobs: [],
      },
      search: '',
      activeDisciplines: 0,
      activeLevels: 0,
      activeLocations: 0,
      filters: {
        disciplines: [],
        levels: [],
        locations: [],
      }
    }

    this.handleFilterDiscipline = this.handleFilterDiscipline.bind(this);
    this.handleFilterLevel = this.handleFilterLevel.bind(this);
    this.handleFilterLocation = this.handleFilterLocation.bind(this);
    this.onSearchInputChange = this.onSearchInputChange.bind(this);
  }

  componentDidMount() {
    // Get details for initial filters (disciplines, levels)
    axios.get(`${CORS}https://github.com/jobjawn/dataDump/raw/master/jobjawn.json`)
    .then(response => {
      this.setState(prevState => {
        let { disciplines, levels } = response.data;
        let filterDisciplines = Array(disciplines.length).fill(false);
        let filterLevels = Array(levels.length).fill(false);

        return {
          data: { ...prevState.data, disciplines, levels },
          filters: {
            ...prevState.filters,
            disciplines: filterDisciplines,
            levels: filterLevels
          }
        }
      });
    })
    .catch(function(error) {
      console.log(error);
    });

    // Get data for all companies
    axios.get(`https://api.github.com/repos/jobjawn/datadump/contents/data`, {
      headers: {
        "Accept": "application/vnd.github.v3+json",
        "X-Requested-With": "XMLHttpRequest"
      }
    })
    .then(jsonListResponse => {
      let companyJSONs = jsonListResponse.data.filter(file => file.name.substr(-4) === 'json').map(company => company.download_url);

      let getURLs = companyJSONs.map(jsonURL => getCompanyJSON(jsonURL));
      // let getURLs = [getCompanyJSON(companyJSONs[0]), getCompanyJSON(companyJSONs[1]), getCompanyJSON(companyJSONs[2])];

      // TO-DO: get JSON a few at a time instead of all at once OR do all processing server-side and pass the result JSON down to the client
      axios.all(getURLs)
      .then((responses) => {

        if (responses.length > 0) {
          // TO-DO: set progress bar based on responses.length
          let progressIdx = 0; 
          let companyData = responses.reduce((accumulator, currentRes, currentIndex) => {
            let jsonParsed = (typeof currentRes.data === 'object') ? currentRes.data : RJSON.parse(currentRes.data);
            let currentData = processCompanyData(jsonParsed, accumulator.locations);
            if (currentData) {
              accumulator.locations = currentData.locations;
              accumulator.companies.push(currentData.company);
              accumulator.autosuggest = accumulator.autosuggest.concat(currentData.autosuggestions);
              accumulator.jobs = accumulator.jobs.concat(currentData.jobs); 
            }
            progressIdx++;
            return accumulator;
          }, {
            locations: [],
            companies: [],
            autosuggest: [],
            jobs: [],
          });

          companyData.locations.sort((a, b) => a.localeCompare(b));
          if (progressIdx === responses.length) this.initFilterLocations(companyData.locations);

          this.setState(prevState => {
            return {
              data: {
                ...prevState.data,
                ...companyData
              }
            }
          });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
    })
    .catch(function(error) {
      console.log(error);
    });

  }

  initFilterLocations(locations) {
    let filterLocations = Array(locations.length).fill(false);
    this.setState(prevState => {
      return {
        filters: {
          ...prevState.filters,
          locations: filterLocations
        }
      }
    })
  }

  handleFilterDiscipline(cbIdx, event) {
    this.setState(prevState => {
      let prevValue = prevState.filters.disciplines[cbIdx];
      let filterDiscipline = prevState.data.disciplines[cbIdx];
      let activeDisciplines = prevState.activeDisciplines;

      if (prevValue === '' || prevValue === false) {
        prevState.filters.disciplines[cbIdx] = filterDiscipline;
        activeDisciplines++;
      } else {
        prevState.filters.disciplines[cbIdx] = '';
        activeDisciplines--;
      }
      
      return {
        filters: prevState.filters,
        activeDisciplines
      }
    })
  }

  handleFilterLevel(cbIdx, event) {
    this.setState(prevState => {
      let prevValue = prevState.filters.levels[cbIdx];
      let filterLevel = prevState.data.levels[cbIdx];
      let activeLevels = prevState.activeLevels;

      if (prevValue === '' || prevValue === false) {
        prevState.filters.levels[cbIdx] = filterLevel;
        activeLevels++;
      } else {
        prevState.filters.levels[cbIdx] = '';
        activeLevels--;
      }
      
      return {
        filters: prevState.filters,
        activeLevels
      }
    })
  }

  handleFilterLocation(cbIdx, event) {
    this.setState(prevState => {
      let prevValue = prevState.filters.locations[cbIdx];
      let filterLocation = prevState.data.locations[cbIdx];
      let activeLocations = prevState.activeLocations;

      if (prevValue === '' || prevValue === false) {
        prevState.filters.locations[cbIdx] = filterLocation;
        activeLocations++;
      } else {
        prevState.filters.locations[cbIdx] = '';
        activeLocations--;
      }

      return {
        filters: prevState.filters,
        activeLocations
      }
    })
  }

  onSearchInputChange(event, { newValue, method }) {
    this.setState({
      search: newValue
    });
  }

  render() {
    let data = this.state.data;
    let filters = this.state.filters;
    let activeFilters = (this.state.activeDisciplines > 0 || this.state.activeLevels > 0 || this.state.activeLocations > 0);

    // filter out job titles or companies that don't match the search text
    let jobs = (this.state.search === '') ? data.jobs : data.jobs.filter(jb => {
      let lc = (this.state.search).toLowerCase();
      return (jb.title.toLowerCase().indexOf(lc) > -1 || jb.company.toLowerCase().indexOf(lc) > -1);
    });

    // TO-DO: should multiple filters of the same category be AND or OR? Radio boxes instead of checkboxes?

    // filter out jobs that don't match the filter criteria
    jobs = (!activeFilters) ? jobs : jobs.filter(jb => {
      let filterDis = (this.state.activeDisciplines === 0) || (this.state.activeDisciplines > 0 && filters.disciplines.indexOf(jb.discipline) > -1);
      let filterLvl = (this.state.activeLevels === 0) || (this.state.activeLevels > 0 && filters.levels.indexOf(jb.level) > -1);
      let filterLoc = (this.state.activeLocations === 0) || (this.state.activeLocations > 0 && filters.locations.indexOf(jb.location) > -1);
      return (filterDis && filterLvl && filterLoc);
    });

    return (
      <div className="App">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <h1>JobJawn</h1>

              <h3>Search</h3>
              <div className="search mb-2">
                <Autosuggestion
                  value={this.state.search}
                  onInputChange={this.onSearchInputChange}
                  data={data.autosuggest}
                />
              </div>

              <h3>Filters</h3>
              <div className="filters">
                <h4>Discipline</h4>
                {data.disciplines && 
                  <div className="filter filter-disciplines">
                    {data.disciplines.length > 0 && filters.disciplines.length > 0 && data.disciplines.map((dis, idx) =>
                      <FilterTag
                        label={dis}
                        checked={checkCheckboxState(filters.disciplines, idx)}
                        handleCheckboxChange={(evt) => this.handleFilterDiscipline(idx, evt)} key={`dis${idx}`} 
                      />
                    )}
                  </div>
                }

                <h4>Experience Level</h4>
                {data.levels &&
                  <div className="filter filter-levels">
                    {data.levels.length > 0 && filters.levels.length > 0 && data.levels.map((lvl, idx) =>
                      <FilterTag
                        label={lvl}
                        checked={checkCheckboxState(filters.levels, idx)}
                        handleCheckboxChange={(evt) => this.handleFilterLevel(idx, evt)} key={`lvl${idx}`} 
                      />
                    )}
                  </div>
                }

                <h4>Location</h4>
                {data.locations &&
                  <div className="filter filter-locations">
                    {data.locations.length > 0 && filters.locations.length > 0 && data.locations.map((loc, idx) =>
                      <FilterTag
                        label={loc}
                        checked={checkCheckboxState(filters.locations, idx)}
                        handleCheckboxChange={(evt) => this.handleFilterLocation(idx, evt)} key={`loc${idx}`}
                      />
                    )}
                  </div>
                }
              </div>

              <h2>Listing</h2>
              <div className="job-listing">
                {jobs.length > 0 && jobs.map((job, idx) => 
                  (
                    <div className="card card-job mb-2" key={idx}>
                      <div className="card-body">
                        <p className="mb-1 text-muted"><small>Found on {job.found}</small></p>
                        <h5 className="card-title">{job.title}</h5>
                        <h6 className="card-subtitle mb-2 text-muted">{job.company} ({job.location})</h6>
                        <div className="mb-2">
                          <a href={job.url} className="card-link">Apply</a>
                          <a href={job.company_url} className="card-link">Company Website</a>
                        </div>
                        <div className="card-tags mb-0">
                          <Tag label={job.discipline}></Tag><Tag label={job.level}></Tag>
                        </div>
                      </div>
                    </div>
                  )
                )}
                {(jobs.length === 0 && activeFilters) &&
                  <div>No jobs found that match the filter criteria.</div>
                }
                {(jobs.length === 0 && !activeFilters) &&
                  <div>No jobs found.</div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
