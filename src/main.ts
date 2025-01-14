import * as core from '@actions/core'
import * as github from '@actions/github'

import { type AnalysisInput, triggerAnalysis } from './hacki'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const apiKey: string = core.getInput('HACKI_API_KEY')
    const apiUrl: string = core.getInput('HACKI_HOST_URL')

    const payload = github.context.payload
    const repository = payload.repository

    const repo = repository?.name ?? 'no_repo_name'
    const repoOwner = repository?.owner.login ?? 'no_repo_owner'
    const repoOwnerType = repository?.owner.type ?? 'no_repo_owner_type'
    const branch = payload.pull_request?.head.ref ?? 'no_branch'

    const pullRequestNumber = payload.number

    // Debug logs are only output if the `ACTIONS_STEP_DEBUG` secret is true
    core.debug(`context: ${JSON.stringify(github.context, null, 2)}`)

    const analysisInput: AnalysisInput = {
      apiKey,
      apiUrl,
      repo: {
        name: repo,
        owner: {
          name: repoOwner,
          type: repoOwnerType
        }
      },
      branch,
      pullRequestNumber
    }

    core.debug(`analysisInput: ${JSON.stringify(analysisInput, null, 2)}`)
    const { id: analysisId } = await triggerAnalysis(analysisInput)
    core.debug(`analysisId: ${analysisId}`)

    // Set outputs for other workflow steps to use
    core.setOutput('analysis_id', analysisId)
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) {
      const errorMsg = `Failed to trigger Hacki analysis: ${error.message}`

      if (core.isDebug()) {
        core.warning(errorMsg)
        return
      }

      core.setFailed(errorMsg)
    }
  }
}
