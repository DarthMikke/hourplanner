import React, { Component } from 'react';
import DateRangePicker from './components/DateRangePicker.js';
import WorkingHours from './components/WorkingHours.js';
import WeekdaysRow from './components/WeekdaysRow.js';
import EmployeeRow from './components/EmployeeRow.js';
import './App.css';

class App extends Component {
  f = Intl.DateTimeFormat('nn', {weekday: 'short', day: 'numeric', month: 'numeric'})
  f2 = Intl.DateTimeFormat('nn', {hour: 'numeric', minute: 'numeric'})
  f3 = Intl.DateTimeFormat('nn', {day: 'numeric', month: 'numeric'})
  f4 = Intl.DateTimeFormat('nn', {year: 'numeric', month: '2-digit', day: '2-digit'})
  constructor(props) {
    super(props)

    // this.f = Intl.DateTimeFormat('nn', {weekday: 'short', day: 'numeric', month: 'numeric'})

    let today = this.f4.formatToParts(new Date())
    let year = today.find(x => x.type === "year").value
    let month = today.find(x => x.type === "month").value
    let day = today.find(x => x.type === "day").value

    let from = new Date(`${year}-${month}-${day}`)
    let to = new Date((from/1000 + 24*3600*6)*1000)
    this.state = {
      loaded: false,
      from: from,
      to: to,
      company: undefined,
      divisions: [],
      dates: [],
      employees: [],
      plannedWorkhours: []
    }
    this.loadData = this.loadData.bind(this)
  }

  componentDidMount() {
    // TODO: fromString, toString
    this.loadData(this.state.from, this.state.to)
  }

  loadData(from, to) {
    var startDate = new Date(from)
    var endDate = new Date(to)
    let startTimestamp = Math.floor(startDate/1000)*1000
    var dates = []
    for(var i=0; i<=6; i++) {
      dates.push(new Date(startTimestamp + i*24*3600*1000))
    }
    console.log(`Dates: ${dates}`)
    this.setState({startDate: startDate, endDate: endDate, dates: dates})

    fetch(`api/list.json?from=${startDate.toString()}&to=${endDate.toString()}`)
      .then(response => response.json())
      .then(x => {
        console.log(x)
        this.setState({
          company: x.company,
          divisions: x.divisions,
          plannedWorkhours: x.planned_workhours, // TODO: Sorter etter tid
          employees: x.employees, // TODO: Sorter alfabetisk
          loaded: true
        })
        return true
      })

    return
  }

  render() {
    let firstDay = this.f3.format(this.state.startDate)
    let lastDay = this.f3.format(this.state.endDate)

    let headers = <WeekdaysRow dates={this.state.dates} />
    let employees = this.state.employees.map(employee => {
      return <EmployeeRow
       dates={this.state.dates}
       plannedWorkhours={this.state.plannedWorkhours}
       employee={employee} />
    })

    if (!this.state.loaded) {
      return <div className="WeeklyView">Loading...</div>
    }

    return (
      <div className="WeeklyView">
        <h1>{this.state.company.name}</h1>
        <DateRangePicker from={this.state.from} to={this.state.to} completion={(from, to) => this.loadData(from, to)} />
        <div key="table" className="table-responsive">
          <table className="table small">
            <thead>
              <tr>
                <th scope="col">Tilsett</th>
                {headers}
                <th scope="col">Totalt</th>
              </tr>
            </thead>
            <tbody>
              {employees}
              {/* TODO: Totalrad */}
            </tbody>
          </table>
        </div>
        {/* TODO: Statusbar */}
      </div>
    );
  }
}

/*function plannedDay(props) {
  return [
  <td>
    {props.planned_workhours.map(x => `Fr??: ${x.from}<br/>Til: ${x.to}.`)}
  </td>,
  <td>{props.planned_workhours.reduce((a, b) => a + b)}</td>
  ]
}*/

export default App;
