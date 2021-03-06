/* jslint browser:true */
/* global define */
/* global describe, beforeEach, jasmine, afterEach, spyOn, it, expect */

define([
	'squire',
	'jquery',
	'select2',
	'backbone'
], function(Squire, $, select2, Backbone) {
	"use strict";

	describe('SearchFilterRowView', function() {
		var SearchFilterRowView, testView, testModel;
		var fetchPubTypeSpy, fetchPubTypeDeferred;
		var costCenterFetchSpy, costCenterFetchActiveDeferred, costCenterFetchNotActiveDeferred
		var injector;
		var $testDiv;

		beforeEach(function (done) {
			injector = new Squire();

			$('body').append('<div id="test-div"></div>');
			$testDiv = $('#test-div');
			testModel = new Backbone.Model();

			fetchPubTypeDeferred = $.Deferred();
			fetchPubTypeSpy = jasmine.createSpy('fetchPubTypeSpy').and.returnValue(fetchPubTypeDeferred);

			costCenterFetchSpy = jasmine.createSpy('costCenterFetchSpy').and.callFake(function(options) {
				if (options.data.active === 'y') {
					return costCenterFetchActiveDeferred;
				}
				else {
					return costCenterFetchNotActiveDeferred;
				}
			});

			injector.mock('models/PublicationTypeCollection', Backbone.Collection.extend({
				fetch: fetchPubTypeSpy,
				toJSON : function() {
					return [{id : 1, text : 'Type1'}, {id : 2, text : 'Type2'}, {id : 3, text : 'Type3'}];
				}
			}));
			injector.mock('models/CostCenterCollection', Backbone.Collection.extend({
				url : '/test/lookup',
				fetch : costCenterFetchSpy
			}));

			spyOn($.fn, 'select2').and.callThrough();
			injector.mock('jquery', $); // Needed to spy on select2 initialization.

			injector.require(['views/SearchFilterRowView'], function (view) {
				SearchFilterRowView = view;
				done();
			});

		});

		afterEach(function () {
			injector.remove();
			if (testView) {
				testView.remove();
			}
			$testDiv.remove();
		});

		it('Expect the publication type collection  to be fetched at initialization', function () {
			testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel
				});
			expect(fetchPubTypeSpy).toHaveBeenCalled();
		});


		describe('Tests for render', function () {

			it('Expects that if the model has some filter categories set, those category options will be disabled', function () {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel
				});
				testModel.set({
					prodId: '1234',
					subtypeName: 'Subtype 1'
				});
				testView.render();
				expect(testView.$('.search-category-input option[value="prodId"]').is(':disabled')).toBe(true);
				expect(testView.$('.search-category-input option[value="indexId"]').is(':disabled')).toBe(false);
				expect(testView.$('.search-category-input option[value="ipdsId"]').is(':disabled')).toBe(false);
				expect(testView.$('.search-category-input option[value="contributor"]').is(':disabled')).toBe(false);
				expect(testView.$('.search-category-input option[value="title"]').is(':disabled')).toBe(false);
				expect(testView.$('.search-category-input option[value="typeName"]').is(':disabled')).toBe(false);
				expect(testView.$('.search-category-input option[value="subtypeName"]').is(':disabled')).toBe(true);
				expect(testView.$('.search-category-input option[value="seriesName"]').is(':disabled')).toBe(false);
				expect(testView.$('.search-category-input option[value="year"]').is(':disabled')).toBe(false);
			});

			it('Expects that if the initialCategory is set to an inputType of text, the select text field is initialized', function() {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel,
					initialCategory : 'year'
				});
				testModel.set('year', '2015');
				testView.render();

				expect($testDiv.find('.value-text-input').val()).toEqual('2015');
			});

			it('Expects that if the initialCategory is typeName, the select2 is initialized after the publicationTypeCollection has been fetched', function() {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel,
					initialCategory : 'typeName'
				});
				testModel.set('typeName', {
					useId : false,
					selections : [{id : 1, text : 'Type1'}, {id : 2, text : 'Type2'}]
				});
				testView.render();
				fetchPubTypeDeferred.resolve();

				expect($testDiv.find('.value-select-input').val()).toEqual(['1', '2']);
			});

			it('Expects that if the initialCategory is subtypeName, the select2 is initialized', function() {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel,
					initialCategory : 'subtypeName'
				});
				testModel.set('subtypeName', {
					useId : false,
					selections : [{id : 1, text : 'Subtype1'}, {id : 2, text : 'Subtype2'}]
				});
				testView.render();

				expect($testDiv.find('.value-select-input').val()).toEqual(['1', '2']);
			});

			it('Expects that if the initialCategory is seriesName, the select2 is initialized', function() {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel,
					initialCategory : 'seriesName'
				});
				testModel.set('seriesName', {
					useId : false,
					selections : [{id : 1, text : 'Series1'}, {id : 2, text : 'Series2'}]
				});
				testView.render();

				expect($testDiv.find('.value-select-input').val()).toEqual(['1', '2']);
			});
		});

		describe('Tests for remove', function () {
			it('Expects that if the category has been set for the row that the correpsonding model property is cleared', function () {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel
				});
				testView.render();
				testView.$('.search-category-input').val('prodId').trigger('change');
				testView.$('.value-text-input').val('1234').trigger('change');
				expect(testModel.get('prodId')).toEqual('1234');

				testView.remove();

				expect(testModel.has('prodId')).toBe(false);
			});
		});

		describe('Tests for model event handlers', function () {
			beforeEach(function () {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel
				});
				testView.render();
			});

			it('Expects that if a filter model attribute is set, then that option is disabled', function () {
				var $prodIdOption = testView.$('.search-category-input option[value="prodId"]');
				expect($prodIdOption.is(':disabled')).toBe(false);
				testModel.set('prodId', '', {changedAttribute : 'prodId'});
				expect($prodIdOption.is(':disabled')).toBe(true);
			});

			it('Expects that if a filter model attribute is unset, then that option becomes enabled', function() {
				var $prodIdOption = testView.$('.search-category-input option[value="prodId"]');
				testModel.set('prodId', '', {changedAttribute : 'prodId'});
				expect($prodIdOption.is(':disabled')).toBe(true);
				testModel.unset('prodId', {changedAttribute : 'prodId'});
				expect($prodIdOption.is(':disabled')).toBe(false);
			});
		});

		describe('Tests for DOM event handlers', function() {
			beforeEach(function() {
				testView = new SearchFilterRowView({
					el: '#test-div',
					model: testModel
				});
				testView.render();
			});

			it('Expects that if the category select option is set, the model property is set and the previous value is unset', function() {
				var $categorySelect = testView.$('.search-category-input');
				$categorySelect.val('prodId').trigger('change');
				expect(testModel.has('prodId')).toBe(true);

				$categorySelect.val('subtypeName').trigger('change');
				expect(testModel.has('prodId')).toBe(false);
				expect(testModel.has('subtypeName')).toBe(true);

				$categorySelect.val('').trigger('change');
				expect(testModel.has('subtypeName')).toBe(false);
			});

			it('Expects that if the category select option is set, the appropriate input element is shown and initialized and that both inputs are cleared', function() {
				var $categorySelect = testView.$('.search-category-input');
				var $textInput = testView.$('.value-text-input');
				var $selectInput = testView.$('.value-select-input');
				var select2Count = $.fn.select2.calls.count();

				$categorySelect.val('prodId').trigger('change');
				expect($textInput.is(':visible')).toBe(true);
				expect($selectInput.is(':visible')).toBe(false);
				expect($.fn.select2.calls.count()).toEqual(select2Count);

				$textInput.val('1234');
				$categorySelect.val('subtypeName').trigger('change');
				expect($textInput.is(':visible')).toBe(false);
				expect($textInput.val()).toBe('');
				expect($selectInput.is(':visible')).toBe(true);
				expect($.fn.select2.calls.count()).toEqual(select2Count + 2); // calls destroy and then initialize

				$selectInput.val('Subtype 1');
				$categorySelect.val('year').trigger('change');
				expect($textInput.is(':visible')).toBe(true);
				expect($selectInput.is(':visible')).toBe(false);
				expect($selectInput.val()).toBe(null);
				expect($.fn.select2.calls.count()).toEqual(select2Count + 2);
			});

			it('Expects that if the category is changed to typeName the select2 will not be initialized until after the publication type collection is fetched', function() {
				var $categorySelect = testView.$('.search-category-input');
				var select2Count;

				$categorySelect.val('typeName').trigger('change');
				select2Count = $.fn.select2.calls.count();

				fetchPubTypeDeferred.resolve();
				expect($.fn.select2.calls.count()).toEqual(select2Count + 1);
			});

			it('Expect that if the text or selected value changes the selected category value is updated in the model', function() {
				var $categorySelect = testView.$('.search-category-input');
				var $textInput = testView.$('.value-text-input');

				$categorySelect.val('prodId').trigger('change');
				$textInput.val('1234').trigger('change');
				expect(testModel.get('prodId')).toEqual('1234');

				$textInput.val('4567').trigger('change');
				expect(testModel.get('prodId')).toEqual('4567');
			});
		});
	});
});
