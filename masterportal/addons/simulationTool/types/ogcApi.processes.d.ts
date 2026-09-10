/**
 * OGC API - Processes - Part 1: Core
 * TypeScript Declaration File
 *
 * Derived from: https://docs.ogc.org/is/18-062r2/18-062r2.html
 * Conformance Class: Core
 * Schemas: http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/
 *
 * @module OGCApiProcesses
 * @see {@link https://docs.ogc.org/is/18-062r2/18-062r2.html|OGC API - Processes - Part 1: Core}
 */

declare namespace OGCApiProcesses {
  /**
   * A link to another resource.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/link.yaml}
   */
  interface Link {
    /** URI reference of the related resource (required) */
    href: string;
    /** The relationship type (e.g., 'self', 'alternate', 'service-desc', 'service-doc') */
    rel?: string;
    /** Media type of the referenced resource (e.g., 'application/json', 'text/html') */
    type?: string;
    /** Language of the referenced resource using RFC5646 */
    hreflang?: string;
    /** A descriptive title for the link */
    title?: string;
  }

  /**
   * Common description properties for processes, inputs, and outputs.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/descriptionType.yaml}
   */
  interface DescriptionType {
    /** A brief human-readable title */
    title?: string;
    /** A longer description of the resource */
    description?: string;
    /** Keywords associated with the resource for cataloguing and discovery */
    keywords?: string[];
    /** Reference to additional metadata */
    metadata?: Link[];
  }

  /**
   * A summary description of a process.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/processSummary.yaml}
   */
  interface ProcessSummary extends DescriptionType {
    /** The unique identifier of the process (required) */
    id: string;
    /** The version of the process (required) */
    version: string;
    /** Execution mode options supported by this process */
    jobControlOptions?: JobControlOption[];
    /** Output transmission modes supported by this process */
    outputTransmission?: TransmissionMode[];
    /** Links to additional resources related to this process */
    links?: Link[];
  }

  /**
   * A complete description of a process.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/process.yaml}
   */
  interface ProcessDescription extends ProcessSummary {
    /** Definitions of the process inputs */
    inputs?: Record<string, InputDescription>;
    /** Definitions of the process outputs */
    outputs?: Record<string, OutputDescription>;
  }

  /**
   * Job control execution modes supported by a process.
   * Options: 'sync-execute', 'async-execute', 'dismiss'
   */
  type JobControlOption = 'sync-execute' | 'async-execute' | 'dismiss';

  /**
   * Output transmission modes.
   * - 'value': Output returned as a value in the response
   * - 'reference': Output returned as a reference/URI
   */
  type TransmissionMode = 'value' | 'reference';

  /**
   * Description of a process input.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/inputDescription.yaml}
   */
  interface InputDescription extends DescriptionType {
    /** The JSON Schema for this input (required) */
    schema: JSONSchema;
    /** Minimum occurrences of this input (default: 1) */
    minOccurs?: number;
    /** Maximum occurrences of this input (default: 1, or 'unbounded') */
    maxOccurs?: number | string;
  }

  /**
   * Description of a process output.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/outputDescription.yaml}
   */
  interface OutputDescription extends DescriptionType {
    /** The JSON Schema for this output (required) */
    schema: JSONSchema;
  }

  /**
   * JSON Schema object for defining input/output schemas.
   * Supports OpenAPI 3.0 compatible JSON Schema Draft 2020-12.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/schema.yaml}
   */
  interface JSONSchema {
    /** The type of the value (e.g., 'string', 'number', 'object', 'array', 'boolean') */
    type?: string | string[];
    /** Description of the schema */
    description?: string;
    /** Default value */
    default?: any;
    /** Example value */
    example?: any;
    /** Enumeration of allowed values */
    enum?: any[];
    /** Constraints for string types */
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    /** Constraints for numeric types */
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: boolean;
    exclusiveMaximum?: boolean;
    /** Constraints for array types */
    minItems?: number;
    maxItems?: number;
    items?: JSONSchema;
    /** Constraints for object types */
    properties?: Record<string, JSONSchema>;
    required?: string[];
    additionalProperties?: boolean | JSONSchema;
    /** Format hints */
    format?: string;
    /** Media type of content (e.g., 'application/json', 'text/xml') */
    contentMediaType?: string;
    /** Content encoding (e.g., 'binary', 'base64') */
    contentEncoding?: string;
    /** Content schema reference */
    contentSchema?: string | JSONSchema;
    /** JSON Schema composition operators */
    allOf?: JSONSchema[];
    anyOf?: JSONSchema[];
    oneOf?: JSONSchema[];
    not?: JSONSchema;
    /** Reference to another schema */
    $ref?: string;
  }

  /**
   * Process input value that can be inline or referenced.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/inlineOrRefData.yaml}
   */
  type InlineOrRefData = InputValue | InputValue[] | Link;

  /**
   * A process input value (inline).
   * Can be a simple literal, qualified value, object, array, or bounding box.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/inputValue.yaml}
   */
  type InputValue = string | number | integer | boolean | InputValue[] | object | BinaryInputValue | BoundingBox | QualifiedInputValue;

  /**
   * A simple integer type (for clarity in documentation).
   */
  type integer = number;

  /**
   * A qualified input value with optional format/encoding specification.
   * Used for complex objects and multi-type inputs.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/qualifiedInputValue.yaml}
   */
  interface QualifiedInputValue extends Format {
    /** The actual input value (required) */
    value: InputValue;
  }

  /**
   * Format qualifier for inputs/outputs.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/format.yaml}
   */
  interface Format {
    /** Media type of the value */
    mediaType?: string;
    /** Character encoding of the value (e.g., 'UTF-8') */
    encoding?: string;
    /** URI reference to a JSON Schema or other schema definition */
    schema?: string | object;
  }

  /**
   * Binary input value (base64-encoded string).
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/binaryInputValue.yaml}
   */
  type BinaryInputValue = string; // base64-encoded

  /**
   * Bounding box in OGC format.
   * Either 4 values (minx, miny, maxx, maxy) for 2D or 6 values for 3D.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/bbox.yaml}
   */
  interface BoundingBox {
    /** Array of 4 (2D) or 6 (3D) numeric values */
    bbox: [number, number, number, number] | [number, number, number, number, number, number];
    /** Coordinate reference system URI (default: http://www.opengis.net/def/crs/OGC/1.3/CRS84) */
    crs?: string;
  }

  /**
   * Execute request body for process execution.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/execute.yaml}
   */
  interface Execute {
    /** Process input values, keyed by input identifier */
    inputs?: Record<string, InlineOrRefData | InlineOrRefData[]>;
    /** Output definitions, keyed by output identifier */
    outputs?: Record<string, Output>;
    /** Response type: 'raw' or 'document' (default: 'raw') */
    response?: 'raw' | 'document';
    /** Subscriber information for asynchronous callbacks */
    subscriber?: Subscriber;
  }

  /**
   * Process output definition in execute request.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/output.yaml}
   */
  interface Output {
    /** Format specification for the output */
    format?: Format;
    /** How the output should be transmitted ('value' or 'reference') */
    transmissionMode?: TransmissionMode;
  }

  /**
   * Subscriber for asynchronous job callbacks.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/subscriber.yaml}
   */
  interface Subscriber {
    /** URI where the server should POST the successful job results */
    successUri?: string;
    /** URI where the server should POST failure notifications */
    failureUri?: string;
    /** URI where the server should POST job status updates */
    inProgressUri?: string;
  }

  /**
   * Job status information.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/statusInfo.yaml}
   */
  interface StatusInfo {
    /** The identifier of the process associated with this job */
    processID?: string;
    /** Type of resource: always 'process' */
    type: 'process';
    /** The unique identifier of the job (required) */
    jobID: string;
    /** The current status of the job (required) */
    status: StatusCode;
    /** A message providing additional information about the job status */
    message?: string;
    /** RFC3339 timestamp when the job was created */
    created?: string;
    /** RFC3339 timestamp when the job started execution */
    started?: string;
    /** RFC3339 timestamp when the job finished (successfully or with error) */
    finished?: string;
    /** RFC3339 timestamp of the last update to the job status */
    updated?: string;
    /** Percentage of job completion (0-100) */
    progress?: number;
    /** Links related to this job */
    links?: Link[];
  }

  /**
   * Job execution status codes.
   * - 'accepted': Job request accepted, waiting to be processed
   * - 'running': Job is currently being executed
   * - 'successful': Job completed successfully
   * - 'failed': Job execution failed
   * - 'dismissed': Job was dismissed/cancelled
   */
  type StatusCode = 'accepted' | 'running' | 'successful' | 'failed' | 'dismissed';

  /**
   * Process execution results.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/results.yaml}
   */
  interface Results {
    /** Result values, keyed by output identifier */
    [outputId: string]: InlineOrRefData;
  }

  /**
   * List of processes.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/processList.yaml}
   */
  interface ProcessList {
    /** Array of process summaries (required) */
    processes: ProcessSummary[];
    /** Navigation links (required) */
    links: Link[];
  }

  /**
   * API landing page.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/landingPage.yaml}
   */
  interface LandingPage {
    /** Navigation links to API resources (required) */
    links: Link[];
    /** Human-readable title */
    title?: string;
    /** Human-readable description */
    description?: string;
  }

  /**
   * Conformance declaration.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/confClasses.yaml}
   */
  interface ConformanceDeclaration {
    /** Array of conformance class URIs that the API implements (required) */
    conformsTo: string[];
  }

  /**
   * Job list with pagination support.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/jobList.yaml}
   */
  interface JobList {
    /** Array of job status info (required) */
    jobs: StatusInfo[];
    /** Navigation links including pagination (required) */
    links: Link[];
  }

  /**
   * API exception response following RFC 7807.
   * @see {@link http://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/exception.yaml}
   */
  interface Exception {
    /** URI reference to the exception type */
    type: string;
    /** HTTP status code */
    status?: number;
    /** Human-readable title of the exception type */
    title?: string;
    /** Detailed explanation of the exception */
    detail?: string;
    /** URI that identifies the specific occurrence of the exception */
    instance?: string;
  }
}

/**
 * Common OGC API - Processes conformance class URIs.
 */
declare namespace OGCApiProcesses.Conformance {
  const CORE: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/core';
  const OGC_PROCESS_DESCRIPTION: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/ogc-process-description';
  const JSON: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/json';
  const HTML: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/html';
  const OPENAPI_3_0: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/oas30';
  const JOB_LIST: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/job-list';
  const CALLBACK: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/callback';
  const DISMISS: 'http://www.opengis.net/spec/ogcapi-processes-1/1.0/conf/dismiss';
}

/**
 * Common OGC API - Processes link relation URIs.
 */
declare namespace OGCApiProcesses.LinkRelations {
  const CONFORMANCE: 'http://www.opengis.net/def/rel/ogc/1.0/conformance';
  const PROCESSES: 'http://www.opengis.net/def/rel/ogc/1.0/processes';
  const JOB_LIST: 'http://www.opengis.net/def/rel/ogc/1.0/job-list';
  const MONITOR: 'monitor';
  const RESULTS: 'results';
}

/**
 * Common OGC API - Processes exception types.
 */
declare namespace OGCApiProcesses.ExceptionTypes {
  const NO_SUCH_PROCESS: 'http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/no-such-process';
  const NO_SUCH_JOB: 'http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/no-such-job';
  const RESULT_NOT_READY: 'http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/result-not-ready';
}

export = OGCApiProcesses;
