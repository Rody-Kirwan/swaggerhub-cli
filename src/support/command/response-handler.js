const { CLIError } = require('@oclif/errors')
const { hasJsonStructure } = require('../../utils/general')

const parseResponse = response => new Promise(resolve => response.text()
  .then(content => resolve({
    status: response.status,
    ok: response.ok,
    content: content,
  })))

const checkForErrors = ({ resolveStatus = [] } = {}) => response => {
  if (resolveStatus.includes(response.status) || response.ok) {
    return Promise.resolve(response)
  }

  return Promise.reject(response)
}

const filterResponseMessaging = response => {
  if (response.status === 403) {
    response.content = response.content.replace(/[.].*::upgrade-link::/, '. You may need to upgrade your current plan.')
    return Promise.reject(response)
  }
  return Promise.resolve(response)
}

const getResponseContent = ({ content }) => content || Promise.reject(
  new Error('No content field provided')
)

const parseContent = content => {
  const { message, error } = JSON.parse(content)
  return message || error
}

const parseResponseError = ({ content }) => hasJsonStructure(content)
  ? parseContent(content)
  : 'Unknown Error'

const handleErrors = error => {
  const cliError = (error instanceof Error === true)
    ? error
    : parseResponseError(error)

  if (hasJsonStructure(cliError)) {
    handleErrors({ content: cliError })
  }

  throw new CLIError(cliError)
}

module.exports = {
  parseResponse,
  checkForErrors,
  getResponseContent,
  handleErrors,
  filterResponseMessaging
}
