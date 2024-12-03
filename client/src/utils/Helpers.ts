export const getEndDateMessage = (dateString?: string): string => {
  if (dateString) {
    const endDate = new Date(dateString)
    const now = new Date()

    if (now > endDate) {
      return `Ended: ${endDate.toLocaleDateString()}`
    } else {
      return `Ends: ${endDate.toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      })}`
    }
  }
  return 'No end date'
}
