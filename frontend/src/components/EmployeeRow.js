import React, { Component } from 'react';
import Schedule from './Schedule.js';

export default class WeekdaysRow extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    let total_this_week = 0
    let schedule = this.props.dates.map(date => {
      let schedule_this_day = this.props.plannedWorkhours
        .map(x => {
          let from = new Date(x.from)
          let to = new Date(x.to)
          return {
            employee: x.employee,
            workhour_id: x.schedule_id,
            from: from,
            to: to,
            duration: (to - from)/1000/3600 // hours
          }
        })
        .filter(planned_hours => {
          let include1 = date <= planned_hours.from
          let include2 = planned_hours.from < new Date((date/1000 + 24*3600)*1000)
          let include3 = planned_hours.employee === this.props.employee.employee_id
          let include = include1 && include2 && include3
          return include
        })

      console.log(`Scheduled hours for ${this.props.employee.name} on ${date.toISOString()}:`)
      console.log(schedule_this_day)
      return <Schedule
        key={date} 
        day={date}
        employee_id={this.props.employee.employee_id}
        viewmodels={schedule_this_day}/> // TODO: tomt eller "–" om det ikkje er nokon timar
    })
    return <tr key={this.props.employee.employee_id}>
      <th>{this.props.employee.name}</th>
      {schedule}
      <td>{total_this_week} t</td>
    </tr>
  }
}
