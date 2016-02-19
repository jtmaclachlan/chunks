<?php if (preg_match('/^\/directory-services-seniors\/$/', $_SERVER['REQUEST_URI']) == 1 ||
          preg_match ('/^\/directory-services-seniors\/\?/', $_SERVER['REQUEST_URI']) == 1
): ?>
  <?php
    // Define a sorting function to discipline misbehaving plugin
    function sort_results($x, $y) {
      $x_object = WPBDP_Listing::get($x);
      $x_sticky = $x_object->get_sticky_status();
      $y_object = WPBDP_Listing::get($y);
      $y_sticky = $y_object->get_sticky_status();

      if ($x_sticky == 'sticky' && $y_sticky == 'normal') {
        return -1;
      } elseif ($x_sticky == 'normal' && $y_sticky == 'sticky') {
        return 1;
      }

      $x_name = $x_object->get_field_value(1);
      $y_name = $y_object->get_field_value(1);

      return strcmp($x_name, $y_name);
    }

    // Grab an instance of the FormFields API
    $ffapi_instance = WPBDP_FormFields::instance();
    // List IDs of fields that we want on the page, and retrieve the necessary fields
    $form_fields = array();
    $required_field_ids = array(2, 9);
    foreach ($required_field_ids as $id) {
      array_push($form_fields, $ffapi_instance->get_field($id));
    }
  ?>

  <!-- Output a form based on the fields retrieved from BDP -->
  <form action="" method="GET">
    <?php foreach ($form_fields as $field): ?>
      <div><?php echo $field->render(); ?></div>
    <?php endforeach; ?>

    <div>
      <input type="hidden" name="submitted" value="1" />
      <input type="submit" value="submit" />
    </div>
  </form>

  <?php
    if (isset($_REQUEST['submitted'])) {
      $api_instance = new WPBDP_Listings_API;
      $search_parameters = array(
        'fields' => array()
      );

      $field_index = 0;
      foreach ($_REQUEST['listingfields'] as $key => $value) {
        $search_parameters['fields'][$field_index] = array(
          'field_id' => $key,
          'q' => $value
        );
        $field_index += 1;
      }

      $results = $api_instance->search($search_parameters);
      usort($results, "sort_results");
      foreach ($results as $r) {
        wpbdp_render_listing($r, 'single', true);
      }
    }
  ?>
<?php else: ?>
  <?php echo do_shortcode('[businessdirectory]') ?>
<?php endif; ?>
