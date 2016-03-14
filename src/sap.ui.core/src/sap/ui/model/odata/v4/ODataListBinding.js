/*!
 * ${copyright}
 */

//Provides class sap.ui.model.odata.v4.ODataListBinding
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/model/Binding",
	"sap/ui/model/ChangeReason",
	"sap/ui/model/ListBinding",
	"./_Context",
	"./_ODataHelper",
	"./lib/_Cache"
], function (jQuery, Binding, ChangeReason, ListBinding, _Context, _ODataHelper, _Cache) {
	"use strict";

	var sClassName = "sap.ui.model.odata.v4.ODataListBinding",
		mSupportedEvents = {
			change : true,
			dataReceived : true,
			dataRequested : true,
			refresh : true
		};

	/**
	 * DO NOT CALL this private constructor for a new <code>ODataListBinding</code>,
	 * but rather use {@link sap.ui.model.odata.v4.ODataModel#bindList bindList} instead!
	 *
	 * @param {sap.ui.model.odata.v4.ODataModel} oModel
	 *   The OData V4 model
	 * @param {string} sPath
	 *   The binding path in the model; must not be empty or end with a slash
	 * @param {sap.ui.model.Context} [oContext]
	 *   The parent context which is required as base for a relative path
	 * @param {object} [mParameters]
	 *   Map of OData query options as specified in "OData Version 4.0 Part 2: URL Conventions".
	 *   The following query options are allowed:
	 *   <ul>
	 *   <li> All "5.2 Custom Query Options" except for those with a name starting with "sap-"
	 *   <li> The $expand and $select "5.1 System Query Options"
	 *   </ul>
	 *   All other query options lead to an error.
	 *   Query options specified for the binding overwrite model query options.
	 *   Note: Query options may only be provided for absolute binding paths as only those
	 *   lead to a data service request.
	 * @throws {Error} When disallowed OData query options are provided
	 *
	 * @alias sap.ui.model.odata.v4.ODataListBinding
	 * @author SAP SE
	 * @class List binding for an OData V4 model.
	 *   An event handler can only be attached to this binding for the following events: 'change',
	 *   'dataReceived', 'dataRequested', and 'refresh'.
	 *   For other events, an error is thrown.
	 * @extends sap.ui.model.ListBinding
	 * @public
	 * @version ${version}
	 */
	var ODataListBinding = ListBinding.extend("sap.ui.model.odata.v4.ODataListBinding", {
			constructor : function (oModel, sPath, oContext, mParameters) {
				ListBinding.call(this, oModel, sPath, oContext);

				if (!sPath || sPath.slice(-1) === "/") {
					throw new Error("Invalid path: " + sPath);
				}
				this.oCache = undefined;
				if (!this.isRelative()) {
					this.oCache = _Cache.create(oModel.oRequestor, sPath.slice(1),
						_ODataHelper.buildQueryOptions(oModel.mUriParameters, mParameters,
							["$expand", "$select"]));
				} else if (mParameters) {
					throw new Error("Bindings with a relative path do not support parameters");
				}
				this.aContexts = [];
				// upper boundary for server-side list length (based on observations so far)
				this.iMaxLength = Infinity;
				// this.bLengthFinal = this.aContexts.length === this.iMaxLength
				this.bLengthFinal = false;
			}
		});

	/**
	 * The 'change' event is fired when the binding is initialized or new contexts are created or
	 * its parent context is changed. It is to be used by controls to get notified about changes to
	 * the binding contexts of this list binding. Registered event handlers are called with the
	 * change reason as parameter.
	 *
	 * @param {sap.ui.base.Event} oEvent
	 * @param {object} oEvent.getParameters
	 * @param {sap.ui.model.ChangeReason} oEvent.getParameters.reason
	 *   The reason for the 'change' event: {@link sap.ui.model.ChangeReason.Change Change}
	 *   when the binding is initialized and or a new context is created, or
	 *   {@link sap.ui.model.ChangeReason.Context Context} when the parent context is changed
	 *
	 * @event
	 * @name sap.ui.model.odata.v4.ODataListBinding#change
	 * @protected
	 * @see sap.ui.base.Event
	 * @since 1.37.0
	 */

	/**
	 * The 'dataRequested' event is fired directly after data has been requested from a back end.
	 * It is to be used by applications for example to switch on a busy indicator.
	 * Registered event handlers are called without parameters.
	 *
	 * @param {sap.ui.base.Event} oEvent
	 *
	 * @event
	 * @name sap.ui.model.odata.v4.ODataListBinding#dataRequested
	 * @public
	 * @see sap.ui.base.Event
	 * @since 1.37.0
	 */

	/**
	 * The 'dataReceived' event is fired after the back end data has been processed and the
	 * registered 'change' event listeners have been notified.
	 * It is to be used by applications for example to switch off a busy indicator or to process an
	 * error.
	 * If back end requests are successful, the event has no parameters. The response data is
	 * available in the model. Note that controls bound to this data may not yet have been updated;
	 * it is thus not safe for registered event handlers to access data via control APIs.
	 * If a back end request fails, the 'dataReceived' event provides an <code>Error</code> in the
	 * 'error' event parameter.
	 *
	 * @param {sap.ui.base.Event} oEvent
	 * @param {object} oEvent.getParameters
	 * @param {Error} [oEvent.getParameters.error] The error object if a back end request failed.
	 *   If there are multiple failed back end requests, the error of the first one is provided.
	 *
	 * @event
	 * @name sap.ui.model.odata.v4.ODataListBinding#dataReceived
	 * @public
	 * @see sap.ui.base.Event
	 * @since 1.37.0
	 */

	// See class documentation
	// @override
	// @public
	// @see sap.ui.base.EventProvider#attachEvent
	// @since 1.37.0
	ODataListBinding.prototype.attachEvent = function (sEventId) {
		if (!(sEventId in mSupportedEvents)) {
			throw new Error("Unsupported event '" + sEventId
				+ "': v4.ODataListBinding#attachEvent");
		}
		return ListBinding.prototype.attachEvent.apply(this, arguments);
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.ListBinding#filter
	 * @since 1.37.0
	 */
	ODataListBinding.prototype.filter = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#filter");
	};

	 /**
	 * Returns already created binding contexts for all entities in this list binding for the range
	 * determined by the given start index <code>iStart</code> and <code>iLength</code>.
	 * If at least one of the entities in the given range has not yet been loaded, fires a
	 * {@link sap.ui.model.Binding#attachChange 'change'} event on this list binding once these
	 * entities have been loaded <em>asynchronously</em>. A further call to this method in the
	 * 'change' event handler with the same index range then yields the updated array of contexts.
	 *
	 * @param {number} [iStart=0]
	 *   The index where to start the retrieval of contexts
	 * @param {number} [iLength]
	 *   The number of contexts to retrieve beginning from the start index; defaults to the model's
	 *   size limit, see {@link sap.ui.model.Model#setSizeLimit}
	 * @param {number} [iThreshold]
	 *   The parameter <code>iThreshold</code> is not supported.
	 * @returns {sap.ui.model.Context[]}
	 *   The array of already created contexts with the first entry containing the context for
	 *   <code>iStart</code>
	 * @throws {Error}
	 *   When <code>iThreshold</code> is given
	 *
	 * @protected
	 * @see sap.ui.model.ListBinding#getContexts
	 * @since 1.37.0
	 */
	ODataListBinding.prototype.getContexts = function (iStart, iLength, iThreshold) {
		var oContext = this.oContext,
			bDataRequested = false,
			sGroupId = this.oModel.getGroupId(),
			oModel = this.oModel,
			oPromise,
			sResolvedPath = oModel.resolve(this.sPath, oContext),
			that = this;

		/**
		 * Checks, whether the contexts exist for the requested range.
		 *
		 * @returns {boolean}
		 *   <code>true</code> if the contexts in the range exist
		 */
		function isRangeInContext() {
			var i,
				n = iStart + iLength;

			for (i = iStart; i < n; i += 1) {
				if (that.aContexts[i] === undefined) {
					return false;
				}
			}
			return true;
		}

		/**
		 * Creates entries in aContexts for each value in oResult.
		 * Uses fnGetPath to create the context path.
		 * Fires 'change' event if new contexts are created.
		 *
		 * @param {array|object} vResult Resolved OData result
		 */
		function createContexts(vResult) {
			var bChanged = false,
				i,
				bNewLengthFinal,
				iResultLength = Array.isArray(vResult) ? vResult.length : vResult.value.length,
				n = iStart + iResultLength;

			for (i = iStart; i < n; i += 1) {
				if (that.aContexts[i] === undefined) {
					bChanged = true;
					that.aContexts[i] = _Context.create(oModel, that, sResolvedPath + "/" + i, i);
				}
			}
			if (that.aContexts.length > that.iMaxLength) {
				// upper boundary obsolete: reset it
				that.iMaxLength = Infinity;
			}
			if (iResultLength < iLength) {
				// less data -> reduce upper boundary for list length and delete obsolete content
				that.iMaxLength = Math.min(iStart + iResultLength, that.iMaxLength);
				if (that.aContexts.length > that.iMaxLength) {
					// delete all contexts after iMaxLength
					that.aContexts.splice(that.iMaxLength,
						that.aContexts.length - that.iMaxLength);
				}
			}
			bNewLengthFinal = that.aContexts.length === that.iMaxLength;
			if (that.bLengthFinal !== bNewLengthFinal) {
				// some controls use this flag instead of calling isLengthFinal
				that.bLengthFinal = bNewLengthFinal;
				// bLengthFinal changed --> control needs to be informed even if no new data is
				// available
				bChanged = true;
			}

			if (bChanged) {
				that._fireChange({reason : ChangeReason.Change});
				// no code below this line
			}
		}

		if (iThreshold !== undefined) {
			throw new Error("Unsupported operation: v4.ODataListBinding#getContexts, "
				+ "iThreshold parameter must not be set");
		}

		iStart = iStart || 0;
		iLength = iLength || oModel.iSizeLimit;

		if (!sResolvedPath) {
			// oModel.resolve() called with relative path w/o context
			// -> e.g. nested listbinding but context not yet set
			return [];
		}

		if (!isRangeInContext(iStart, iLength)) {
			oPromise = this.oCache
				? this.oCache.read(iStart, iLength, sGroupId, undefined,
					function () {
						bDataRequested = true;
						that.oModel.dataRequested(sGroupId,
							that.fireDataRequested.bind(that));
					}
				)
				: oContext.requestValue(this.sPath);
			oPromise.then(function (vResult) {
				createContexts(vResult);
				//fire dataReceived after change event fired in createContexts()
				if (bDataRequested) {
					that.fireDataReceived(); // no try catch needed: uncaught in promise
				}
			}, function (oError) {
				//cache shares promises for concurrent read
				if (bDataRequested) {
					if (oError.canceled) {
						that.fireDataReceived();
					} else {
						jQuery.sap.log.error("Failed to get contexts for "
								+ oModel.sServiceUrl + sResolvedPath.slice(1)
								+ " with start index " + iStart + " and length " + iLength,
							oError, sClassName);
						that.fireDataReceived({error : oError});
					}
				}
			});
		}
		return this.aContexts.slice(iStart, iStart + iLength);
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.ListBinding#getCurrentContexts
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.getCurrentContexts = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#getCurrentContexts");
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.ListBinding#getDistinctValues
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.getDistinctValues = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#getDistinctValues");
	};

	/**
	 * Returns the number of entries in the list. As long as the client does not know the size on
	 * the server an estimated length is returned.
	 *
	 * @returns {number}
	 *   The number of entries in the list
	 *
	 * @public
	 * @see sap.ui.model.ListBinding#getLength
	 * @since 1.37.0
	 */
	 // @override
	ODataListBinding.prototype.getLength = function() {
		return this.bLengthFinal ? this.aContexts.length : this.aContexts.length + 10;
	};

	/**
	 * Initializes the OData list binding. Fires a 'change' event in case the binding has a
	 * resolved path.
	 *
	 * @protected
	 * @see sap.ui.model.Binding#initialize
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.initialize = function () {
		if (this.oModel.resolve(this.sPath, this.oContext)) {
			this._fireChange({reason : ChangeReason.Change});
		}
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.Binding#isInitial
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.isInitial = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#isInitial");
	};

	/**
	 * Returns <code>true</code> if the length has been determined by the data returned from
	 * server. If the length is a client side estimation <code>false</code> is returned.
	 *
	 * @returns {boolean}
	 *   If <code>true</true> the length is determined by server side data
	 *
	 * @public
	 * @see sap.ui.model.ListBinding#isLengthFinal
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.isLengthFinal = function() {
		return this.bLengthFinal;
	};

	/**
	 * Refreshes the binding. Prompts the model to retrieve data from the server and notifies the
	 * control that new data is available. <code>bForceUpdate</code> has to be <code>true</code>.
	 * If <code>bForceUpdate</code> is not given or <code>false</code>, an error is thrown.
	 * Refresh is supported for absolute bindings.
	 *
	 * @param {boolean} bForceUpdate
	 *   The parameter <code>bForceUpdate</code> has to be <code>true</code>.
	 * @param {string} [sGroupId]
	 *   The parameter <code>sGroupId</code> is not supported.
	 * @throws {Error} When <code>bForceUpdate</code> is not <code>true</code> or
	 *   <code>sGroupId</code> is set or refresh on this binding is not supported.
	 *
	 * @public
	 * @see sap.ui.model.Binding#refresh
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.refresh = function (bForceUpdate, sGroupId) {
		if (bForceUpdate !== true) {
			throw new Error("Unsupported operation: v4.ODataListBinding#refresh, "
				+ "bForceUpdate must be true");
		}
		if (sGroupId !== undefined) {
			throw new Error("Unsupported operation: v4.ODataListBinding#refresh, "
				+ "sGroupId parameter must not be set");
		}
		if (!this.oCache) {
			throw new Error("Refresh on this binding is not supported");
		}
		this.oCache.refresh();
		this.aContexts = [];
		this.iMaxLength = Infinity;
		this.bLengthFinal = false;
		this._fireRefresh({reason : ChangeReason.Refresh});
	};

	/**
	 * Requests the value for the given path and index; the value is requested from this binding's
	 * cache or from its context in case it has no cache.
	 *
	 * @param {string} [sPath]
	 *   Some relative path
	 * @param {number} [iIndex]
	 *   Index corresponding to some current context of this binding
	 * @returns {Promise}
	 *   A promise on the outcome of the cache's <code>read</code> call
	 *
	 * @private
	 */
	ODataListBinding.prototype.requestValue = function (sPath, iIndex) {
		return this.oCache
			? this.oCache.read(iIndex, /*iLength*/1, undefined, sPath)
			: this.oContext.requestValue(this.sPath + "/" + iIndex
				+ (sPath ? "/" + sPath : ""));
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.Binding#resume
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.resume = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#resume");
	};

	/**
	 * Sets the context and resets the cached contexts of the list items.
	 *
	 * @param {sap.ui.model.Context} oContext
	 *   The context object
	 *
	 * @private
	 * @see sap.ui.model.Binding#setContext
	 */
	// @override
	ODataListBinding.prototype.setContext = function (oContext) {
		if (this.oContext !== oContext) {
			this.aContexts = [];
			Binding.prototype.setContext.call(this, oContext);
		}
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.ListBinding#sort
	 * @since 1.37.0
	 */
	ODataListBinding.prototype.sort = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#sort");
	};

	/**
	 * Method not supported
	 *
	 * @throws {Error}
	 *
	 * @public
	 * @see sap.ui.model.Binding#suspend
	 * @since 1.37.0
	 */
	// @override
	ODataListBinding.prototype.suspend = function () {
		throw new Error("Unsupported operation: v4.ODataListBinding#suspend");
	};

	return ODataListBinding;

}, /* bExport= */ true);
