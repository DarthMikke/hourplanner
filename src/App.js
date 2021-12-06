import React, { Component } from 'react';
import WorkingHours from './components/WorkingHours.js';
import WeekdaysRow from './components/WeekdaysRow.js';
import EmployeeRow from './components/EmployeeRow.js'
import './App.css';

class App extends Component {
  f = Intl.DateTimeFormat('nn', {weekday: 'short', day: 'numeric', month: 'numeric'})
  f2 = Intl.DateTimeFormat('nn', {hour: 'numeric', minute: 'numeric'})
  f3 = Intl.DateTimeFormat('nn', {day: 'numeric', month: 'numeric'})
  constructor(props) {
    super(props)

    // this.f = Intl.DateTimeFormat('nn', {weekday: 'short', day: 'numeric', month: 'numeric'})

    this.state = {dates: [], employees: [], plannedWorkhours: []}
    this.loadData = this.loadData.bind(this)
  }

  componentDidMount() {
    let from = new Date(2021, 11, 1)
    let to = new Date(from/1000 + 24*3600)
    // TODO: fromString, toString
    this.loadData("2021-11-01", "2021-11-07")
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
        this.setState({plannedWorkhours: x.planned_workhours, employees: x.employees}) // TODO: Sorter etter tid og alfabetisk
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

    return (
      <div className="App">
        <div key="datePicker">{firstDay}–{lastDay}</div>
        <div key="table" className="table-responsive">
          <table className="table">
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

function plannedDay(props) {
  return [
  <td>
    {props.planned_workhours.map(x => `Frå: ${x.from}<br/>Til: ${x.to}.`)}
  </td>,
  <td>{props.planned_workhours.reduce((a, b) => a + b)}</td>
  ]
}

export default App;
