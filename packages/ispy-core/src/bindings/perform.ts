/**
 * Validates the request,
 * Populates the req object in the user context,
 * Validates user permissions against roleRequirements
 * Performs the operation,
 * And sends the response
 * 
 * perform({
 *      request: req
 *      response: res,
 *      headers: headers,
 *      bodyParser: Entities.Username,
 *      roleRequirements?: ["player", "admin", "player-self"],
 *      operation: lib.removeAdmin,
 * })
 */