import React, { Component } from 'react';
import WeeklyView from './components/WeeklyView.js';
import './App.css';

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      view: "weekly",
    }
  }

  componentDidMount() {
  }

  render() {

    return (
      <WeeklyView />
      /* TODO: Statusbar */
    );
  }
}

/*function plannedDay(props) {
  return [
  <td>
    {props.planned_workhours.map(x => `Frå: ${x.from}<br/>Til: ${x.to}.`)}
  </td>,
  <td>{props.planned_workhours.reduce((a, b) => a + b)}</td>
  ]
}*/

export default App;
