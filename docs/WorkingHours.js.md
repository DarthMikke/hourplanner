# WorkingHours.js

A react component displaying planned workhours for a single day. Takes a list of objects containing timespans as properties.

Every span of hours is displayed in its own `<div />`. A single timespan can be edited at a time. If a timespan is being edited, it will be rendered by `<SingleWorkingHoursEditing />` instead of a `<div />`.

## Status
Every hourspan can be edited, and will send an API request upon saving. Saving status is to be displayed as an icon in the component's `<div />`. The order of events is:
1. Validate times. If invalid, display red/green borders around the appropriate input fields and break the list.
2. Set `this.state.waiting = this.state.editing`.
3. Set `this.state.editing = false`.
4. Send API request to the API endpoint.
5. If the request is successful, skip to 6. Otherwise set `this.state.error = this.state.editing`.
6. Replace the viewmodel's data with the data in the API response.
7. Set `this.state.waiting = false`.
